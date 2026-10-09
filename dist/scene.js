import { escapeHTML, CATEGORIES, STATUSES } from './state.js';
const P=(x,y,z=0)=>[540+(x-y)*.86,84+(x+y)*.44-z];
const points=a=>a.map(p=>P(...p).join(',')).join(' ');
const poly=(a,fill,extra='')=>`<polygon points="${points(a)}" fill="${fill}" ${extra}/>`;
function box(x,y,z,w,d,h,top='#fff',left='#d5dfec',right='#e5ebf3',extra='') {
  return `<g ${extra}>${poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],left)}${poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],right)}${poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top)}</g>`;
}
function line(a,b,color,width=1,extra=''){const p=P(...a),q=P(...b);return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${color}" stroke-width="${width}" ${extra}/>`;}
function plant(x,y){const p=P(x+10,y+10,47);return box(x,y,0,22,22,24,'#fff','#d4dedb','#e7eee7')+`<ellipse cx="${p[0]}" cy="${p[1]+5}" rx="17" ry="22" fill="#9bbfb0"/><ellipse cx="${p[0]-7}" cy="${p[1]+3}" rx="9" ry="16" fill="#78a895"/><ellipse cx="${p[0]+5}" cy="${p[1]-4}" rx="10" ry="17" fill="#b6d1b8"/>`;}
function desk(x,y,color='#dae6f8',active=true){
  let s='';for(const [a,b] of [[3,3],[93,3],[3,43],[93,43]])s+=box(x+a,y+b,0,5,5,42,'#e0e7ef','#9baebf','#b5c5d2');
  s+=box(x,y,42,104,54,6,color,'#b3c6dc','#c8d9e8');
  s+=box(x+38,y+18,48,19,13,2,'#dbe5ee','#b9c9d9','#d3dce7');
  s+=box(x+47,y+20,49,3,4,13,'#b3c5d9','#91a6be','#a3b6cc');
  s+=box(x+24,y+15,62,54,4,33,'#394b67','#324663','#61738d');
  s+=poly([[x+27,y+19.1,65],[x+74,y+19.1,65],[x+74,y+19.1,91],[x+27,y+19.1,91]],active?'#83b2dd':'#a8b7c9',active?'class="monitor-glow"':'');
  for(let k=0;k<3;k++)s+=line([x+32,y+19.2,85-k*6],[x+58+(k%2)*8,y+19.2,85-k*6],'#d6edfa',1.6);
  s+=box(x+32,y+37,48,37,12,2,'#f4f8fc','#c9d7e5','#e1e8ee');
  for(let k=0;k<4;k++)s+=line([x+35+k*7,y+39,50.5],[x+35+k*7,y+47,50.5],'#cbd7e3',1);
  s+=box(x+83,y+30,48,9,9,10,'#fff','#d2dde8','#e8edf3');
  return s;
}
function chair(x,y,color){return box(x+9,y+10,0,5,5,22,'#92a3b8','#8c9caf','#b2c0cf')+box(x,y,20,30,28,6,color,'#93a6bc','#abbcd0')+box(x,y+24,24,30,5,29,color,'#92a5c0','#a9bcd4');}
function person(x,y,color){const p=P(x+13,y+10,57);return box(x+3,y+2,22,23,18,24,color,color,'#9fadd2')+`<ellipse cx="${p[0]}" cy="${p[1]}" rx="10" ry="12" fill="#ecc9a9"/><path d="M${p[0]-10},${p[1]} q-4,-21 11,-16 q13,4 9,17 q-6,-10 -12,-6Z" fill="#465064"/>`;}
function noteBoard(x,y){let s=box(x,y,0,6,4,80,'#c4cbd3','#acb8c5','#b7c5d2')+box(x+112,y,0,6,4,80,'#c4cbd3','#acb8c5','#b7c5d2');s+=box(x-4,y,50,129,5,73,'#edf1e5','#dde5d2','#d7dfcd');
 for(let c=0;c<3;c++){for(let r=0;r<2;r++){const a=x+6+c*38;const z=106-r*23;s+=poly([[a,y+5.1,z],[a+28,y+5.1,z],[a+28,y+5.1,z-17],[a,y+5.1,z-17]],['#e9ce93','#b8cedd','#bed4af'][c]);s+=line([a+5,y+5.2,z-5],[a+23,y+5.2,z-5],'#fff',1.6);}}
 return s;
}
function zoneLabel(x,y,label,meta,color){return `<g class="scene-label"><text x="${x}" y="${y}" fill="${color}" font-size="13" font-weight="650" letter-spacing="1.2">${label}</text><text x="${x}" y="${y+19}" fill="#9aa6b4" font-size="11">${meta}</text></g>`;}
function taskBubble(task,x,y){if(!task)return '';const colors={personal:'#5e8fce',ai:'#9a86cb',todo:'#b39854'};const color=colors[task.category];const title=task.title.length>16?task.title.slice(0,15)+'…':task.title;return `<g class="svg-station scene-task-label" role="button" tabindex="0" aria-label="${escapeHTML(task.title)} 상세 보기" data-task-id="${escapeHTML(task.id)}"><rect class="station-focus" x="${x}" y="${y}" width="198" height="59" rx="9" fill="white" stroke="#e1e7ef" filter="url(#bubble-shadow)"/><circle cx="${x+15}" cy="${y+18}" r="3.5" fill="${color}"/><text class="scene-label" x="${x+25}" y="${y+22}" font-size="12" font-weight="550" fill="#4a586c">${escapeHTML(title)}</text><text class="scene-label" x="${x+15}" y="${y+43}" font-size="10" fill="#9ba7b6">${STATUSES[task.status]}${task.category==='ai'?' · DEMO':''}</text><text x="${x+181}" y="${y+43}" text-anchor="end" font-size="10" fill="${color}">${task.status==='done'?'✓ 완료':task.status==='doing'?task.progress+'%':''}</text><path d="M${x+89} ${y+59} l10 7 10-7" fill="white" stroke="#e1e7ef" stroke-width="1"/><path d="M${x+90} ${y+58.5}h18" stroke="white" stroke-width="2"/></g>`;}
export function renderScene(tasks,category='all',demo=false){
  const by=c=>tasks.filter(t=>t.category===c);const active=c=>by(c).some(t=>t.status==='doing');
  const main=c=>by(c).find(t=>t.status==='doing')||by(c).find(t=>t.status!=='done')||by(c)[0];
  const cls=c=>category==='all'||category===c?'scene-normal':'scene-dim';
  let s=`<defs><filter id="floor-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="16" flood-color="#58749d" flood-opacity=".13"/></filter><filter id="bubble-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#38506f" flood-opacity=".07"/></filter></defs><g id="scene-content">`;
  s+=`<g filter="url(#floor-shadow)">${box(0,0,-14,560,410,14,'#f9fbfe','#d4deed','#e3eaf4')}</g>`;
  for(let x=40;x<560;x+=40)s+=line([x,0,0.2],[x,410,.2],'#eaf0f6');for(let y=40;y<410;y+=40)s+=line([0,y,.2],[560,y,.2],'#eaf0f6');
  s+=box(0,0,0,560,6,80,'#d7e4f2','#e2eaf4','#c3d5e9');
  s+=box(0,0,0,6,200,80,'#d4e1f0','#c9d9ea','#e6edf5');
  for(let x=28;x<550;x+=125){s+=poly([[x,6.2,15],[x+92,6.2,15],[x+92,6.2,63],[x,6.2,63]],'#f1f7fc','stroke="#ccdaea" stroke-width="2"');s+=line([x+46,6.3,16],[x+46,6.3,62],'#d6e2ee',2);}
  s+=`<g class="${cls('personal')}">`;
  s+=poly([[18,35,1],[265,35,1],[265,212,1],[18,212,1]],'#eaf1fc','stroke="#d9e5f6" stroke-width="1"');
  s+=desk(50,65,'#d8e5f9',active('personal'))+desk(171,65,'#d8e5f9',false);
  s+=chair(84,129,'#b8ccef')+person(86,127,'#718fc9')+chair(204,129,'#b8ccef');
  s+=plant(22,172)+box(178,174,0,65,28,27,'#fff','#d9e1ec','#e9eef5')+box(184,177,27,14,15,4,'#b9c8e4','#90a5c7','#a5b9d4');
  s+=zoneLabel(247,232,'PERSONAL DESK',`${by('personal').length}개의 업무 · ${by('personal').filter(t=>t.status==='doing').length}개 진행 중`,'#7899c8');
  s+='</g>';
  s+=`<g class="${cls('ai')}">`;
  s+=poly([[292,29,1],[540,29,1],[540,208,1],[292,208,1]],'#eeebf8','stroke="#e1dcf0" stroke-width="1"');
  s+=desk(316,50,'#e1dcf0',active('ai'))+desk(427,50,'#e1dcf0',active('ai'));
  s+=chair(350,115,'#c7bcdf')+chair(460,115,'#c7bcdf');
  for(let i=0;i<3;i++){s+=box(329+i*60,154,0,42,30,48,'#f4f1fc','#c5bfdb','#dbd6e8');for(let j=0;j<3;j++){s+=line([334+i*60,184.1,13+j*11],[365+i*60,184.1,13+j*11],'#a89dc7',2);}const p=P(365+i*60,185,38);s+=`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="${active('ai')?'#a1c59c':'#b3b6c1'}"/>`;}
  s+=zoneLabel(832,280,'AI LAB',`${by('ai').length}개의 업무 · ${demo?'시뮬레이션 중':'AI 연결 전'}`,'#9b8cbb');
  s+='</g>';
  const routeA='M 460 292 L 555 340 L 658 288';
  s+=`<path d="${routeA}" fill="none" stroke="#cbd8e6" stroke-width="2" stroke-dasharray="5 6"/>`;
  if(active('personal')||demo)s+=`<circle r="4" fill="#a5bbd1" class="work-particle" style="offset-path:path('${routeA}')"/><circle r="3" fill="#b5c6dd" class="work-particle second" style="offset-path:path('${routeA}')"/>`;
  s+=`<g class="${cls('todo')}">`;
  s+=poly([[190,238,1],[510,238,1],[510,385,1],[190,385,1]],'#f0f2e8','stroke="#e2e6d6" stroke-width="1"');
  s+=noteBoard(214,249)+box(363,265,0,103,55,37,'#e9e1c9','#c9c1a6','#dbd2b9');
  s+=box(375,273,37,24,28,3,'#fcfcf5','#d4d4c6','#e9e9df')+box(407,277,37,29,20,3,'#c5d5b9','#a1b292','#b9c9ab');
  s+=chair(395,328,'#c2cfac')+plant(482,348);
  s+=zoneLabel(478,494,'DAILY PLANNER',`${by('todo').filter(t=>t.status==='done').length}개 완료 · 하나씩 가볍게`,'#92a477');
  s+='</g>';
  s+=plant(16,310)+plant(526,17);
  s+=box(36,256,0,72,42,24,'#d2dfcf','#a9bfa7','#bfd1ba')+box(32,280,22,80,9,29,'#cbdac8','#a0b69e','#bbceb5')+box(32,256,22,9,30,16,'#d0decb','#b0c3a9','#bbceb5')+box(103,256,22,9,30,16,'#d0decb','#b0c3a9','#bbceb5');
  s+=box(89,321,0,37,35,20,'#fff','#d0dbe7','#e3eaf2')+box(99,328,20,13,14,3,'#d5dfcc','#b2c0a8','#c7d4bc');
  const tp=P(143,335,2);s+=`<text x="${tp[0]}" y="${tp[1]}" font-size="12" letter-spacing="2" fill="#b3becb" transform="rotate(27 ${tp[0]} ${tp[1]})">MAKE ROOM FOR GOOD WORK.</text>`;
  s+=`<g class="${cls('personal')}">${taskBubble(main('personal'),235,83)}</g><g class="${cls('ai')}">${taskBubble(main('ai'),701,70)}</g><g class="${cls('todo')}">${taskBubble(main('todo'),380,302)}</g>`;
  for(const [c,x,y] of [['personal',226,172],['ai',892,200],['todo',392,404]]){const n=by(c).filter(t=>t.status!=='done').length;const color=c==='personal'?'#7c9bcc':c==='ai'?'#a191c3':'#a5b789';s+=`<g class="svg-station ${cls(c)}" data-category="${c}" role="button" tabindex="0" aria-label="${CATEGORIES[c]} 보기, 남은 업무 ${n}개"><circle class="station-focus" cx="${x}" cy="${y}" r="17" fill="white" stroke="#dfe6ee"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="${color}" font-size="14" font-weight="650">${n}</text></g>`;}
  s+='</g>';return s;
}
