import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1512,height:1100}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
const url=process.env.ORBIT_TEST_URL||'http://localhost:5173';
const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('orbit-workspace-v1')));
const count=async()=>Number(await page.locator('#metrics .metric-value').first().evaluate(el=>el.firstChild.textContent));
let checks=0;
function pass(name){checks++;console.log(`PASS ${name}`);}
try{
  await page.goto(url);await page.locator('.task-card').first().waitFor();
  assert.equal(await count(),12);assert.equal(await page.locator('.task-card').count(),12);pass('initial workspace renders 12 consistent tasks without missing assets');
  await fs.mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
  await page.locator('.scene-task-label[data-task-id="p1"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#task-title').inputValue(),'새 프로젝트 기획안 작성');
  await page.locator('select[name="status"]').selectOption('done');await page.getByRole('button',{name:'저장하기',exact:true}).click();
  assert.equal((await stored()).tasks.find(t=>t.id==='p1').status,'done');
  assert.equal(await page.locator('#metrics .metric-value').nth(3).evaluate(el=>el.firstChild.textContent),'6');
  await page.reload();assert.equal(await page.locator('.task-card.done[data-task-id="p1"]').count(),1);pass('keyboard scene inspection, completion, metric update and reload persistence');
  await page.locator('#add-task').click();await page.locator('#task-title').fill('테스트 <안전한 업무>');await page.locator('select[name="category"]').selectOption('todo');await page.getByRole('button',{name:'저장하기',exact:true}).click();
  assert.equal(await count(),13);assert.equal(await page.locator('.task-card-title').filter({hasText:'테스트 <안전한 업무>'}).count(),1);
  const added=(await stored()).tasks.find(t=>t.title==='테스트 <안전한 업무>');assert.ok(added);pass('create task safely renders markup-like user content');
  await page.locator('#task-search').fill('안전한');assert.equal(await page.locator('.task-card').count(),1);await page.locator('#task-search').fill('');
  await page.locator('#category-tabs [data-category="todo"]').click();assert.equal(await page.locator('.task-lane').count(),1);assert.equal(await page.locator('.task-card').count(),5);await page.locator('#category-tabs [data-category="all"]').click();pass('search and category filters');
  const checkbox=page.locator(`[data-check-id="${added.id}"]`);
  await checkbox.click();assert.equal((await stored()).tasks.find(t=>t.id===added.id).status,'done');await page.locator('#undo-action').click();assert.equal((await stored()).tasks.find(t=>t.id===added.id).status,'todo');pass('complete task and undo restores prior state');
  await page.locator(`.task-card[data-task-id="${added.id}"]`).click();await page.locator('#delete-task').click();assert.equal(await count(),12);await page.locator('#undo-action').click();assert.equal(await count(),13);pass('delete task and undo restores record');
  await page.locator('#demo-toggle').click();await page.waitForTimeout(2200);const advanced=(await stored()).tasks.find(t=>t.id==='a1').progress;assert.ok(advanced>62);await page.locator('#demo-toggle').click();await page.waitForTimeout(2200);assert.equal((await stored()).tasks.find(t=>t.id==='a1').progress,advanced);pass('AI demo advances only after start and stays paused');
  await page.locator('#timer-start').click();await page.waitForTimeout(1200);assert.notEqual(await page.locator('#timer-value').innerText(),'25:00');await page.locator('#timer-start').click();const paused=await page.locator('#timer-value').innerText();await page.waitForTimeout(1100);assert.equal(await page.locator('#timer-value').innerText(),paused);await page.locator('#timer-reset').click();assert.equal(await page.locator('#timer-value').innerText(),'25:00');pass('focus timer starts, pauses and resets');
  await page.locator('#zoom-in').click();assert.equal(await page.locator('#zoom-reset').innerText(),'110%');await page.locator('#zoom-reset').click();await page.locator('#motion-toggle').click();assert.equal(await page.locator('.scene-container.motion-paused').count(),1);pass('zoom and animation controls');
  for(const width of [390,768,1024]){await page.setViewportSize({width,height:844});const bounds=await page.evaluate(()=>{const s=document.querySelector('.scene-container').getBoundingClientRect();const z=document.querySelector('.zoom-controls').getBoundingClientRect();return {width:innerWidth,body:document.body.scrollWidth,sceneRight:s.right,zoomRight:z.right};});assert.ok(bounds.body<=width,JSON.stringify(bounds));assert.ok(bounds.sceneRight<=width&&bounds.zoomRight<=width,JSON.stringify(bounds));}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/mobile.png',fullPage:true});pass('390px, 768px and 1024px layouts have no clipped scene controls or page overflow');
  const reduced=await browser.newContext({reducedMotion:'reduce'});const reducedPage=await reduced.newPage();await reducedPage.goto(url);assert.ok(await reducedPage.locator('.scene-container').evaluate(el=>el.classList.contains('motion-paused')));await reduced.close();pass('reduced-motion preference is respected');
  await page.evaluate(()=>localStorage.setItem('orbit-workspace-v1',JSON.stringify({tasks:[],activities:[]})));await page.reload();assert.equal(await count(),0);assert.equal(await page.locator('.task-card').count(),0);await page.reload();assert.equal(await count(),0);pass('intentionally empty workspace remains empty after reload');
  await page.evaluate(()=>localStorage.setItem('orbit-workspace-v1','broken'));await page.reload();assert.equal(await count(),12);assert.ok((await page.locator('#toast').innerText()).includes('읽지 못해'));pass('corrupt local data has recoverable warning');
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};});await page.locator('#add-task').click();await page.locator('#task-title').fill('저장 실패 검증');await page.getByRole('button',{name:'저장하기',exact:true}).click();assert.ok((await page.locator('#toast').innerText()).includes('저장되지 않았어요'));assert.equal(await count(),13);pass('storage failure is visible without losing in-memory edits');
  const mcpContext=await browser.newContext();await mcpContext.addInitScript(()=>{window.testTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.testTools[tool.name]=tool;}}});});const mp=await mcpContext.newPage();await mp.goto(url);const result=await mp.evaluate(async()=>{const tools=window.testTools;const created=await tools.create_workspace_task.execute({title:'도구로 추가한 업무',category:'todo'});await tools.update_workspace_task_status.execute({id:created.id,status:'done'});let invalid=false;try{await tools.create_workspace_task.execute({title:'',category:'invalid'});}catch{invalid=true;}const read=await tools.list_workspace_tasks.execute({});return {names:Object.keys(tools),created,invalid,tasks:read.tasks};});assert.equal(result.names.length,3);assert.ok(result.invalid);assert.equal(result.tasks.find(t=>t.id===result.created.id).status,'done');assert.equal(await mp.locator('.task-card.done').filter({hasText:'도구로 추가한 업무'}).count(),1);await mcpContext.close();pass('optional WebMCP tool contract uses shared UI state and rejects invalid input (test registry)');
  assert.deepEqual(errors,[]);pass('no JavaScript errors or failed page resources');
  console.log(`\n${checks} browser checks passed. Screenshots: artifacts/desktop.png, artifacts/mobile.png`);
}finally{await browser.close();}
