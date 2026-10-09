export const CATEGORIES = { personal: '개인 업무', ai: 'AI 업무', todo: '할 일' };
export const STATUSES = { todo: '시작 전', doing: '진행 중', review: '검토 필요', done: '완료' };
export const STORAGE_KEY = 'orbit-workspace-v1';
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function seedTasks() {
  const due = localDate();
  return [
    { id:'p1',title:'새 프로젝트 기획안 작성',category:'personal',status:'doing',priority:'high',due,note:'아이디어를 정리하고 핵심 사용자 흐름을 설계해요.',progress:40 },
    { id:'p2',title:'포트폴리오 업데이트',category:'personal',status:'todo',priority:'normal',due:'',note:'최근 프로젝트의 과정과 결과를 기록하기',progress:0 },
    { id:'p3',title:'브랜드 레퍼런스 정리',category:'personal',status:'review',priority:'normal',due,note:'수집한 레퍼런스에서 방향성 결정하기',progress:100 },
    { id:'p4',title:'주간 업무 돌아보기',category:'personal',status:'done',priority:'normal',due,note:'이번 주에 배운 것, 다음 주에 할 것',progress:100 },
    { id:'a1',title:'시장 트렌드 리서치',category:'ai',status:'doing',priority:'high',due,note:'리서치 에이전트 · 관심 분야의 흐름 요약 (예시 업무)',progress:62 },
    { id:'a2',title:'블로그 콘텐츠 초안',category:'ai',status:'doing',priority:'normal',due,note:'라이팅 에이전트 · 아이디어를 읽기 좋은 글로 (예시 업무)',progress:35 },
    { id:'a3',title:'회의록 핵심 내용 정리',category:'ai',status:'todo',priority:'normal',due:'',note:'회의의 결정 사항과 다음 액션 정리 (예시 업무)',progress:0 },
    { id:'a4',title:'자료 분류 및 태그 정리',category:'ai',status:'done',priority:'low',due,note:'흩어진 자료를 주제별로 모으기 (예시 업무)',progress:100 },
    { id:'t1',title:'읽고 싶었던 아티클 읽기',category:'todo',status:'todo',priority:'normal',due,note:'저장해 둔 글 중 한 편을 천천히 읽기',progress:0 },
    { id:'t2',title:'오늘의 우선순위 정하기',category:'todo',status:'done',priority:'high',due,note:'가장 중요한 일 세 가지 정하기',progress:100 },
    { id:'t3',title:'메일함 가볍게 비우기',category:'todo',status:'done',priority:'normal',due,note:'필요한 답장을 보내고 자료 보관하기',progress:100 },
    { id:'t4',title:'오전 스트레칭 10분',category:'todo',status:'done',priority:'low',due,note:'잠깐 일어나서 몸 풀기',progress:100 },
  ];
}
export function validateTask(task) {
  return task && typeof task.id==='string' && task.id.length>0 && typeof task.title==='string' && task.title.trim().length>0 && task.title.length<=80 && Object.hasOwn(CATEGORIES, task.category) && Object.hasOwn(STATUSES,task.status) && ['high','normal','low'].includes(task.priority) && typeof task.note==='string' && task.note.length<=1000 && typeof task.due==='string' && (task.due==='' || /^\d{4}-\d{2}-\d{2}$/.test(task.due)) && Number.isFinite(task.progress) && task.progress>=0 && task.progress<=100;
}
export function readState(storage) {
  const fallback = {tasks:seedTasks(),activities:[{id:'welcome',text:'나의 스튜디오를 열었어요. 오늘도 하나씩 시작해 볼까요?',at:Date.now()}]};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {...fallback,warning:null};
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.tasks) || !parsed.tasks.every(validateTask) || new Set(parsed.tasks.map(t=>t.id)).size!==parsed.tasks.length) throw new Error('invalid data');
    const activities=Array.isArray(parsed.activities)?parsed.activities.filter(a=>typeof a.id==='string' && typeof a.text==='string' && Number.isFinite(a.at)).slice(0,15):[];
    return {tasks:parsed.tasks,activities,warning:null};
  } catch { return {...fallback,warning:'저장한 업무를 읽지 못해 예시 화면을 열었어요. 저장 공간을 확인해 주세요.'}; }
}
export function saveState(storage,state) {
  try {storage.setItem(STORAGE_KEY,JSON.stringify({tasks:state.tasks,activities:state.activities}));return true;} catch {return false;}
}
export function withStatus(task,status) {
  if (!Object.hasOwn(STATUSES,status)) throw new Error('올바르지 않은 업무 상태입니다.');
  return {...task,status,progress:status==='done'||status==='review'?100:status==='todo'?0:Math.min(task.progress || 5,95)};
}
export function summarize(tasks) {
  return {total:tasks.length,doing:tasks.filter(t=>t.status==='doing').length,ai:tasks.filter(t=>t.category==='ai'&&t.status!=='done').length,done:tasks.filter(t=>t.status==='done').length};
}
export function advanceDemo(tasks) {
  return tasks.map(task=>{
    if(task.category!=='ai'||task.status!=='doing')return task;
    const progress=Math.min(100,task.progress+4);
    return {...task,progress,status:progress===100?'review':'doing'};
  });
}
export function escapeHTML(value) {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
