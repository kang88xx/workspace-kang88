// Shared by AI execution, AI-assisted checks and AI-assisted monitoring.
// A future service adapter must supply real quota snapshots and honor AbortSignal.
export const QUOTA_MAX_AGE_MS = 60_000;
export const QUOTA_ACTIONS = Object.freeze(['execute', 'check', 'monitor']);

export function assessWeeklyQuota(snapshot, request = {}, now = Date.now()) {
  const result = { canRun: false, needsApproval: false, low: false, remainingPercent: null };
  if (!QUOTA_ACTIONS.includes(request.action)) return { ...result, reason: 'invalid-action' };
  if (snapshot?.connected !== true) return { ...result, reason: 'disconnected' };

  const { remainingPercent, observedAt, resetsAt } = snapshot;
  if (!Number.isFinite(remainingPercent) || remainingPercent < 0 || remainingPercent > 100 ||
      !Number.isFinite(observedAt) || observedAt > now || !Number.isFinite(resetsAt) || resetsAt <= observedAt) {
    return { ...result, reason: 'unknown' };
  }
  // A reset timestamp passing is not proof that the provider replenished the quota.
  if (now - observedAt >= QUOTA_MAX_AGE_MS || now >= resetsAt) return { ...result, reason: 'stale' };

  const current = { ...result, remainingPercent, low: remainingPercent > 0 && remainingPercent < 5 };
  if (remainingPercent === 0) return { ...current, reason: 'exhausted', needsApproval: true };
  // Never silently switch to API credits, pay-as-you-go or an unknown billing source.
  if (request.billingSource !== 'weekly' ||
      (request.requiresExtraUsage !== undefined && request.requiresExtraUsage !== false)) {
    return { ...current, reason: 'approval-required', needsApproval: true };
  }
  return { ...current, canRun: true, reason: current.low ? 'low' : 'ready' };
}

export function formatRemaining(value) {
  if (!Number.isFinite(value)) return '—';
  if (value > 0 && value < 0.1) return '<0.1%';
  // Do not round a value just below 5 up to the 5% threshold.
  return `${Math.floor(value * 10) / 10}%`;
}

export class WeeklyQuotaGuard {
  constructor({ now = Date.now } = {}) {
    this.now = now;
    this.snapshot = null;
    this.active = new Map();
    this.watchdog = null;
  }

  updateUsage(snapshot) {
    this.snapshot = snapshot ? { ...snapshot } : null;
    this.recheck();
  }

  assess(request) {
    return assessWeeklyQuota(this.snapshot, request, this.now());
  }

  recheck() {
    for (const [controller, request] of this.active) {
      const decision = this.assess(request);
      if (!decision.canRun) controller.abort(decision.reason);
    }
  }

  async run(request, operation) {
    const acceptedRequest = { ...request };
    const decision = this.assess(acceptedRequest);
    if (!decision.canRun) return { executed: false, decision };
    const controller = new AbortController();
    this.active.set(controller, acceptedRequest);
    // This local timer reads numbers; it does not call an AI service or consume tokens.
    this.watchdog ??= setInterval(() => this.recheck(), 1000);
    let onAbort;
    const cancelled = new Promise(resolve => {
      onAbort = () => resolve({ executed: false, stopped: true, decision: this.assess(acceptedRequest) });
      controller.signal.addEventListener('abort', onAbort, { once: true });
    });
    try {
      const completed = Promise.resolve().then(async () => {
        this.recheck();
        if (controller.signal.aborted) return { executed: false, stopped: true, decision: this.assess(acceptedRequest) };
        const value = await operation(controller.signal);
        // Revalidate before accepting completion, including after suspension in a background tab.
        this.recheck();
        return controller.signal.aborted
          ? { executed: false, stopped: true, decision: this.assess(acceptedRequest) }
          : { executed: true, value, decision: this.assess(acceptedRequest) };
      });
      return await Promise.race([completed, cancelled]);
    } finally {
      controller.signal.removeEventListener('abort', onAbort);
      this.active.delete(controller);
      if (!this.active.size) {
        clearInterval(this.watchdog);
        this.watchdog = null;
      }
    }
  }

  dispose() {
    this.snapshot = null;
    this.recheck();
    clearInterval(this.watchdog);
    this.watchdog = null;
  }
}
