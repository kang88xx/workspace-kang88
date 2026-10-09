import { WeeklyQuotaGuard, formatRemaining } from './weekly-quota.js';

const $ = selector => document.querySelector(selector);
const labels = { execute: 'AI 실행', check: 'AI 확인', monitor: 'AI 감시' };
const requestFor = action => ({ action, billingSource: 'weekly' });
const guard = new WeeklyQuotaGuard();
let generation = 0;
let running = false;
let previewRemaining = 20;
let pendingRequest = null;

function showPreviewStatus(decision) {
  const messages = {
    ready: '주간 제공량 안에서 실행할 수 있어요.',
    low: '주간 잔여량이 5% 미만입니다. 소진되면 작업이 정지됩니다.',
    exhausted: '주간 잔여량 0% · 실행·확인·감시를 모두 정지했습니다.',
    'approval-required': '추가 사용이 필요한 작업입니다. 승인 전에는 실행하지 않습니다.',
    unknown: '잔여량을 확인하지 못해 실행·확인·감시를 보류합니다.',
    stale: '최신 사용량을 확인할 때까지 실행·확인·감시를 보류합니다.',
    disconnected: '서비스 연결 전에는 실제 AI 작업을 실행하지 않습니다.',
  };
  $('#quota-preview-percent').textContent = formatRemaining(decision.remainingPercent);
  const status = $('#quota-preview-status');
  status.textContent = messages[decision.reason] || '실행할 수 없는 요청입니다.';
  status.dataset.level = decision.canRun ? (decision.low ? 'warning' : 'ready') : 'blocked';
  status.setAttribute('role', decision.low || decision.reason === 'exhausted' ? 'alert' : 'status');
  $('#quota-preview-meter').style.width = `${decision.remainingPercent ?? 0}%`;
  $('#quota-preview-meter').dataset.level = status.dataset.level;
}

function updateButtons() {
  document.querySelectorAll('[data-quota-action]').forEach(button => { button.disabled = running; });
  $('#quota-preview-stop').hidden = !running;
}

function resetPreview() {
  generation += 1;
  guard.updateUsage(null);
  running = false;
  pendingRequest = null;
  const scenario = $('#quota-preview-scenario').value;
  previewRemaining = Number(scenario);
  if (scenario !== 'unknown') {
    const now = Date.now();
    guard.updateUsage({ connected: true, remainingPercent: previewRemaining, observedAt: now, resetsAt: now + 7 * 86_400_000 });
  } else {
    guard.updateUsage({ connected: true });
  }
  $('#quota-preview-event').textContent = '테스트 버튼을 누르면 예시 잔여량만 감소합니다. 실제 토큰은 사용하지 않습니다.';
  showPreviewStatus(guard.assess(requestFor('execute')));
  updateButtons();
}

function stopPreview(message) {
  generation += 1;
  guard.updateUsage(null);
  running = false;
  updateButtons();
  if (message) $('#quota-preview-event').textContent = message;
}

function openExtraDialog(request) {
  pendingRequest = { action: request.action, preview: true };
  $('#quota-extra-action').textContent = labels[request.action];
  $('#quota-extra-remaining').textContent = formatRemaining(guard.assess(requestFor(request.action)).remainingPercent);
  $('#quota-extra-dialog').showModal();
  $('#quota-extra-cancel').focus();
}

async function runPreview(action) {
  if (running) return;
  const request = requestFor(action);
  const decision = guard.assess(request);
  showPreviewStatus(decision);
  if (!decision.canRun) {
    if (decision.needsApproval) openExtraDialog(request);
    return;
  }
  const currentGeneration = ++generation;
  running = true;
  updateButtons();
  $('#quota-preview-event').textContent = `${labels[action]} 테스트 중 · 매 단계 주간 한도를 확인합니다.`;
  // Exercise the same guard for all three actions without any network request.
  const outcome = await guard.run(request, signal => new Promise(resolve => {
    let steps = 0;
    const timer = setInterval(() => {
      if (signal.aborted) return;
      previewRemaining = Math.max(0, previewRemaining - 1);
      guard.updateUsage({ connected: true, remainingPercent: previewRemaining, observedAt: Date.now(), resetsAt: Date.now() + 7 * 86_400_000 });
      showPreviewStatus(guard.assess(request));
      steps += 1;
      if (steps >= 3 || signal.aborted) {
        clearInterval(timer);
        signal.removeEventListener('abort', abort);
        resolve();
      }
    }, 700);
    const abort = () => { clearInterval(timer); resolve(); };
    signal.addEventListener('abort', abort, { once: true });
  }));
  if (currentGeneration !== generation) return;
  running = false;
  updateButtons();
  showPreviewStatus(outcome.decision);
  if (outcome.stopped) {
    $('#quota-preview-event').textContent = `${labels[action]} 테스트를 중지했습니다. 자동으로 재시작하지 않습니다.`;
    if (outcome.decision.needsApproval) openExtraDialog(request);
  } else {
    $('#quota-preview-event').textContent = `${labels[action]} 테스트 완료 · 예시 주간 제공량만 사용했습니다.`;
  }
}

export function initWeeklyQuotaUI() {
  // Real provider usage stays unknown. Preview snapshots never enter task state or storage.
  $('#quota-policy-open').addEventListener('click', () => {
    $('#quota-policy-dialog').showModal();
    resetPreview();
  });
  $('#quota-preview-scenario').addEventListener('change', resetPreview);
  document.querySelectorAll('[data-quota-action]').forEach(button => {
    button.addEventListener('click', () => void runPreview(button.dataset.quotaAction));
  });
  $('#quota-preview-stop').addEventListener('click', () => {
    const remaining = previewRemaining;
    stopPreview();
    const now = Date.now();
    guard.updateUsage({ connected: true, remainingPercent: remaining, observedAt: now, resetsAt: now + 7 * 86_400_000 });
    showPreviewStatus(guard.assess(requestFor('execute')));
    $('#quota-preview-event').textContent = '테스트를 일시정지했습니다.';
  });
  $('#quota-preview-extra').addEventListener('click', () => {
    // Requesting extra usage first suspends current preview work; never switch billing implicitly.
    if (running) {
      const remaining = previewRemaining;
      stopPreview();
      const now = Date.now();
      guard.updateUsage({ connected: true, remainingPercent: remaining, observedAt: now, resetsAt: now + 7 * 86_400_000 });
    }
    const request = { ...requestFor('monitor'), requiresExtraUsage: true };
    const decision = guard.assess(request);
    showPreviewStatus(decision);
    if (decision.needsApproval) openExtraDialog(request);
  });
  $('#quota-extra-dialog').addEventListener('close', () => {
    if (pendingRequest) $('#quota-preview-event').textContent = '추가 사용은 승인되지 않았습니다. 주간 제공량만 사용하는 정책을 유지합니다.';
    pendingRequest = null;
  });
  $('#quota-policy-dialog').addEventListener('close', () => {
    if ($('#quota-extra-dialog').open) $('#quota-extra-dialog').close();
    stopPreview();
  });
  window.addEventListener('pagehide', () => { stopPreview(); guard.dispose(); }, { once: true });
}
