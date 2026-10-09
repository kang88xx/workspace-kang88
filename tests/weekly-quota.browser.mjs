import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
const externalRequests = [];
const url = process.env.ORBIT_TEST_URL || 'http://localhost:5173';
page.on('pageerror', error => errors.push(error.message));
page.on('request', req => { if (!req.url().startsWith(url)) externalRequests.push(req.url()); });
let checks = 0;
const pass = text => { checks++; console.log(`PASS ${text}`); };
try {
  await page.goto(url);
  await page.locator('#quota-policy-open').waitFor();
  assert.equal(await page.locator('#quota-live-percent').innerText(), '—');
  assert.ok((await page.locator('.quota-card').innerText()).includes('서비스 미연결'));
  pass('live quota stays unknown while the service is unconnected');

  await page.locator('#quota-policy-open').click();
  await page.locator('#quota-preview-scenario').selectOption('5');
  assert.equal(await page.locator('#quota-preview-status').getAttribute('data-level'), 'ready');
  await page.locator('#quota-preview-scenario').selectOption('4');
  assert.equal(await page.locator('#quota-preview-status').getAttribute('role'), 'alert');
  assert.equal(await page.locator('#quota-preview-status').getAttribute('data-level'), 'warning');
  pass('exactly 5% is permitted without warning; below 5% raises an alert');

  for (const action of ['execute', 'check', 'monitor']) {
    await page.locator('#quota-preview-scenario').selectOption('0');
    await page.locator(`[data-quota-action="${action}"]`).click();
    await page.locator('#quota-extra-dialog[open]').waitFor();
    assert.equal(await page.locator('#quota-extra-remaining').innerText(), '0%');
    assert.equal(await page.locator('#quota-extra-dialog button.primary-button').isDisabled(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#quota-preview-percent').innerText(), '0%');
  }
  pass('all three actions stop at zero and surface the approval modal without enabling paid usage');

  await page.locator('#quota-preview-scenario').selectOption('1');
  await page.locator('[data-quota-action="monitor"]').click();
  await page.locator('#quota-extra-dialog[open]').waitFor();
  assert.equal(await page.locator('#quota-preview-percent').innerText(), '0%');
  assert.ok((await page.locator('#quota-preview-event').innerText()).includes('중지'));
  await page.locator('#quota-extra-cancel').click();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('#quota-preview-percent').innerText(), '0%');
  pass('running monitoring is cancelled at zero and closing the modal cannot restart it');

  await page.locator('#quota-preview-scenario').selectOption('20');
  await page.locator('[data-quota-action="execute"]').click();
  await page.locator('#quota-preview-extra').click();
  await page.locator('#quota-extra-dialog[open]').waitFor();
  const held = await page.locator('#quota-preview-percent').innerText();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('#quota-preview-percent').innerText(), held);
  await page.locator('#quota-extra-cancel').click();
  await page.waitForFunction(() => document.querySelector('#quota-preview-event').textContent.includes('승인되지 않았습니다'));
  assert.ok((await page.locator('#quota-preview-event').innerText()).includes('승인되지 않았습니다'));
  pass('requesting extra usage pauses work and dismissal leaves weekly-only policy intact');

  await page.locator('#quota-preview-scenario').selectOption('unknown');
  await page.locator('[data-quota-action="check"]').click();
  assert.equal(await page.locator('#quota-preview-percent').innerText(), '—');
  assert.equal(await page.locator('#quota-preview-status').getAttribute('data-level'), 'blocked');
  assert.equal(await page.locator('#quota-extra-dialog').evaluate(el => el.open), false);
  pass('an unknown quota blocks work without treating missing usage as free allowance');

  await page.locator('#quota-preview-scenario').selectOption('20');
  await page.locator('[data-quota-action="check"]').click();
  await page.locator('#quota-preview-stop').click();
  const paused = await page.locator('#quota-preview-percent').innerText();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('#quota-preview-percent').innerText(), paused);
  await page.getByRole('button', { name: '주간 한도 정책 닫기', exact: true }).click();
  await page.locator('#quota-policy-open').click();
  assert.equal(await page.locator('#quota-preview-percent').innerText(), '20%');
  assert.equal(await page.locator('#quota-live-percent').innerText(), '—');
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  pass('pause, close and reopen are safe; demo quota never persists or overwrites real usage');

  await fs.mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/weekly-policy-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, dialog: document.querySelector('#quota-policy-dialog').getBoundingClientRect().width, viewport: innerWidth }));
  assert.ok(widths.page <= widths.viewport && widths.dialog < widths.viewport);
  await page.locator('#quota-preview-scenario').selectOption('4');
  await page.screenshot({ path: 'artifacts/weekly-policy-mobile.png', fullPage: true });
  pass('policy and warning modal fit a mobile viewport');
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  pass('no JavaScript errors or external requests: monitoring preview consumes no AI tokens');
  console.log(`\n${checks} weekly-policy browser checks passed.`);
} finally {
  await browser.close();
}
