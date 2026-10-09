import test from 'node:test';
import assert from 'node:assert/strict';
import { assessWeeklyQuota, WeeklyQuotaGuard, QUOTA_ACTIONS, QUOTA_MAX_AGE_MS, formatRemaining } from '../dist/weekly-quota.js';

const now = 1_800_000_000_000;
const usage = percent => ({ connected: true, remainingPercent: percent, observedAt: now, resetsAt: now + 86_400_000 });
const request = action => ({ action, billingSource: 'weekly' });

test('execution, checks and monitoring share the weekly-only policy', () => {
  for (const action of QUOTA_ACTIONS) {
    assert.equal(assessWeeklyQuota(usage(20), request(action), now).canRun, true);
    const paid = assessWeeklyQuota(usage(20), { action, billingSource: 'api' }, now);
    assert.equal(paid.canRun, false);
    assert.equal(paid.needsApproval, true);
    assert.equal(assessWeeklyQuota(usage(20), { action }, now).canRun, false);
    assert.equal(assessWeeklyQuota(usage(20), { ...request(action), requiresExtraUsage: 'false' }, now).canRun, false);
  }
});

test('warning threshold is strictly below 5% and zero always stops', () => {
  for (const action of QUOTA_ACTIONS) {
    assert.equal(assessWeeklyQuota(usage(5), request(action), now).low, false);
    assert.equal(assessWeeklyQuota(usage(4.999), request(action), now).low, true);
    assert.equal(assessWeeklyQuota(usage(0.001), request(action), now).canRun, true);
    const empty = assessWeeklyQuota(usage(0), request(action), now);
    assert.equal(empty.reason, 'exhausted');
    assert.equal(empty.canRun, false);
  }
  assert.equal(formatRemaining(0.001), '<0.1%');
  assert.equal(formatRemaining(4.999), '4.9%');
});

test('unconnected, malformed, stale and expired snapshots fail closed', () => {
  const req = request('execute');
  assert.equal(assessWeeklyQuota(null, req, now).reason, 'disconnected');
  assert.equal(assessWeeklyQuota({ ...usage(20), connected: 'true' }, req, now).canRun, false);
  for (const remainingPercent of [null, undefined, NaN, Infinity, -1, 101, '50']) {
    assert.equal(assessWeeklyQuota({ ...usage(20), remainingPercent }, req, now).canRun, false);
  }
  assert.equal(assessWeeklyQuota({ ...usage(20), observedAt: now + 1 }, req, now).canRun, false);
  assert.equal(assessWeeklyQuota(usage(20), req, now + QUOTA_MAX_AGE_MS).reason, 'stale');
  assert.equal(assessWeeklyQuota({ ...usage(0), resetsAt: now + 1 }, req, now + 1).reason, 'stale');
  assert.equal(assessWeeklyQuota(usage(20), request('unknown'), now).canRun, false);
});

test('extra usage never executes without approval, including with weekly quota remaining', async () => {
  const guard = new WeeklyQuotaGuard({ now: () => now });
  guard.updateUsage(usage(50));
  let called = false;
  const result = await guard.run({ ...request('monitor'), requiresExtraUsage: true }, () => { called = true; });
  assert.equal(called, false);
  assert.equal(result.decision.reason, 'approval-required');
  guard.dispose();
});

test('0% aborts running work and rejects further starts for every action', async () => {
  for (const action of QUOTA_ACTIONS) {
    const guard = new WeeklyQuotaGuard({ now: () => now });
    guard.updateUsage(usage(1));
    let signal;
    const pending = guard.run(request(action), received => { signal = received; return new Promise(() => {}); });
    await Promise.resolve();
    guard.updateUsage(usage(0));
    const result = await pending;
    assert.equal(signal.aborted, true);
    assert.equal(result.stopped, true);
    assert.equal(result.decision.reason, 'exhausted');
    const next = await guard.run(request(action), () => assert.fail('must not execute at zero'));
    assert.equal(next.executed, false);
    assert.equal(guard.watchdog, null);
    guard.dispose();
  }
});

test('stale usage aborts ongoing work; a refreshed allowance does not auto-restart it', async () => {
  let clock = now;
  const guard = new WeeklyQuotaGuard({ now: () => clock });
  guard.updateUsage(usage(20));
  let calls = 0;
  const pending = guard.run(request('check'), () => { calls++; return new Promise(() => {}); });
  await Promise.resolve();
  clock += QUOTA_MAX_AGE_MS;
  guard.recheck();
  assert.equal((await pending).decision.reason, 'stale');
  guard.updateUsage({ ...usage(100), observedAt: clock });
  assert.equal(calls, 1);
  assert.equal(guard.active.size, 0);
  guard.dispose();
});

test('usage changes between authorization and execution prevent the call', async () => {
  const guard = new WeeklyQuotaGuard({ now: () => now });
  guard.updateUsage(usage(20));
  const pending = guard.run(request('execute'), () => assert.fail('no call after depletion'));
  guard.updateUsage(usage(0));
  assert.equal((await pending).executed, false);
  guard.dispose();
});

test('completed operations are rechecked and rejected operations clean up', async () => {
  let clock = now;
  const guard = new WeeklyQuotaGuard({ now: () => clock });
  guard.updateUsage(usage(20));
  const result = await guard.run(request('execute'), () => { clock += QUOTA_MAX_AGE_MS; return 'result'; });
  assert.equal(result.executed, false);
  guard.updateUsage({ ...usage(20), observedAt: clock });
  await assert.rejects(guard.run(request('monitor'), () => { throw new Error('provider failure'); }), /provider failure/);
  assert.equal(guard.active.size, 0);
  assert.equal(guard.watchdog, null);
  guard.dispose();
});
