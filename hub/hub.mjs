import {scoreData,safeCSV,renamePlan,escapeHTML as esc} from './core.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
if(new URLSearchParams(location.search).has('shot'))document.body.classList.add('shot-mode');
function toast(t){const n=$('.toast');n.textContent=t;n.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.hidden=true,2200);}
function download(text,name,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('전체 문장을 복사했어요.');}catch{const d=$('#copy-dialog');d.querySelector('textarea').value=text;d.showModal();d.querySelector('textarea').focus();d.querySelector('textarea').select();}}
$$('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy));
const type=document.body.dataset.page;
if(type==='scores'){
 const samples={normal:'과목,시험1,시험2,시험3\n수학,72,78,81\n영어,86,82,84',gap:'과목,시험1,시험2,시험3\n수학,72,78,81\n영어,86,,84',zero:'과목,시험1,시험2,시험3\n수학,72,78,81\n영어,86,0,84',invalid:'과목,시험1,시험2,시험3\n수학,72,78,101\n영어,86,82,84'};
 let current=[],valid=false;
 const delta=d=>d===null?'계산 불가':(d>0?'+':'')+d+'점';
 function draw(){
  const error=$('#scores-error');error.hidden=true;
  try{current=scoreData($('#scores-csv').value);valid=true;}catch(e){error.textContent=e.message;error.hidden=false;$('#score-result').hidden=true;valid=false;$('#download-report').disabled=true;$('#download-scores').disabled=true;return;}
  $('#score-result').hidden=false;$('#download-report').disabled=false;$('#download-scores').disabled=false;
  $('#metrics').innerHTML=current.map(r=>`<div class="metric"><span>${esc(r.subject)}</span><b>${delta(r.delta)}</b><small>시험1 → 시험3 · 원점수 차이</small></div>`).join('');
  const x=i=>70+225*i,y=v=>235-v*1.9,colors=['#245b43','#be6046','#4e6492','#83683b'];
  let svg='<svg class="chart" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="과목별 원점수 변화. 아래 표에서 모든 값을 확인할 수 있습니다."><rect width="600" height="300" fill="#fff"/>';
  for(const v of [0,25,50,75,100])svg+=`<path d="M55 ${y(v)}H550" stroke="#dce2d6"/><text x="42" y="${y(v)+5}" text-anchor="end" font-size="13" fill="#56665b">${v}</text>`;
  for(let i=0;i<3;i++)svg+=`<text x="${x(i)}" y="269" text-anchor="middle" font-size="14" fill="#203c31">시험${i+1}</text>`;
  current.forEach((r,ri)=>{const color=colors[ri%colors.length];let path='',pen=false;
   r.values.forEach((v,i)=>{if(v===null){pen=false;return;}path+=(pen?'L':'M')+x(i)+' '+y(v)+' ';pen=true;});
   svg+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="3" ${ri%2?'stroke-dasharray="7 5"':''}/>`;
   r.values.forEach((v,i)=>{if(v===null)return;svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="${color}"/>`;if($('#labels').value==='on')svg+=`<text x="${x(i)}" y="${y(v)+(ri%2?-13:22)}" text-anchor="middle" font-size="15" font-weight="700" fill="${color}">${v}</text>`;});
  });svg+='</svg>';$('#chart').innerHTML=svg;
  $('#score-table').innerHTML='<table><caption>원자료와 직접 대조하세요.</caption><thead><tr><th>과목</th><th>시험1</th><th>시험2</th><th>시험3</th><th>차이</th></tr></thead><tbody>'+current.map(r=>`<tr><th>${esc(r.subject)}</th>${r.values.map(v=>`<td>${v===null?'자료 없음':v}</td>`).join('')}<td>${delta(r.delta)}</td></tr>`).join('')+'</tbody></table>';
 }
 $('#draw-scores').onclick=draw;$('#labels').onchange=draw;
 $('#scores-csv').oninput=()=>{valid=false;$('#score-result').hidden=true;$('#download-report').disabled=true;$('#download-scores').disabled=true;};
 $$('[data-sample]').forEach(b=>b.onclick=()=>{$('#scores-csv').value=samples[b.dataset.sample];draw();});
 $('#download-scores').onclick=()=>{if(valid)download(safeCSV([['과목','시험1','시험2','시험3'],...current.map(r=>[r.subject,...r.values])]),'scores.csv','text/csv;charset=utf-8');};
 $('#download-report').onclick=()=>{if(valid)download('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>가상 성적 보고서</title><style>body{max-width:800px;margin:30px auto;padding:20px;font:18px/1.7 sans-serif;color:#203c31}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #ccc}.metrics{display:flex;gap:30px}.metric b{display:block;font-size:30px}.chart{width:100%}</style><h1>가상 성적 보고서</h1>'+$('#score-result').innerHTML+'</html>','report.html','text/html;charset=utf-8');};
 $('#download-plan').onclick=()=>download('다음 공부 계획\n\n'+$('#study-plan').value,'study-plan.txt');draw();
}
if(type==='major'){
 let majors=await (await fetch('hub/majors.json')).json();
 function append(r,i){const n=document.createElement('article');n.className='major-row';n.innerHTML=`<div><label class="choose"><input type="checkbox" checked data-major="${i}"> 비교표에 포함</label><h3>${esc(r.name)}</h3><b>${esc(r.courses)}</b><p>${esc(r.fact)}</p>${r.source?`<a href="${esc(r.source)}" target="_blank" rel="noopener" class="source">공식 교육과정 확인 ↗</a>`:'<span class="source">출처를 입력한 뒤 확인하세요.</span>'}</div><div><label for="interest-${i}">내 관심과의 연결 · 나의 해석</label><textarea id="interest-${i}" rows="2">${esc(r.interest)}</textarea><label for="question-${i}">더 알아볼 질문</label><input id="question-${i}" value="${esc(r.question)}"></div>`;$('#major-rows').append(n);}
 majors.forEach(append);
 $('#add-major').onclick=()=>{if($('#custom-major'))return;const n=document.createElement('div');n.className='panel';n.id='custom-major';n.innerHTML='<h3>내 후보 학과</h3><label>대학·학과명<input id="custom-name"></label><label>공식 자료에서 확인한 과목<input id="custom-courses"></label><label>출처 주소<input id="custom-source" type="url" placeholder="https://"></label><label>자료 확인 날짜<input id="custom-date" type="date"></label><button id="save-major">비교 목록에 추가</button><p id="custom-error" role="alert"></p>';$('#major-rows').append(n);$('#custom-name').focus();$('#save-major').onclick=()=>{const name=$('#custom-name').value.trim(),courses=$('#custom-courses').value.trim(),source=$('#custom-source').value.trim(),date=$('#custom-date').value;let url;try{url=new URL(source);}catch{}if(!name||!courses||!date||!url||!['https:','http:'].includes(url.protocol)){$('#custom-error').textContent='학과명·과목·http(s) 출처 주소·확인 날짜를 채워 주세요.';return;}const row={name,courses,source:url.href,date,fact:'직접 입력한 자료예요. 출처 원문과 다시 대조하세요.',interest:'',question:''};majors.push(row);n.remove();append(row,majors.length-1);};};
 $('#download-majors').onclick=()=>{const selected=$$('[data-major]:checked').map(n=>Number(n.dataset.major));if(!selected.length){$('#major-status').textContent='비교할 학과를 하나 이상 선택하세요.';return;}const rows=[['학과','공식 자료의 내용','내 관심과 연결되는 점(나의 해석)','더 알아볼 질문','출처','확인 날짜'],...selected.map(i=>[majors[i].name,majors[i].courses,$('#interest-'+i).value,$('#question-'+i).value,majors[i].source,majors[i].date||'2026-10-19'])];download(safeCSV(rows),'major-comparison.csv','text/csv;charset=utf-8');$('#major-status').textContent=selected.length+'개 학과의 비교표를 저장했어요.';};
}
if(type==='files'){
 const initial=[{old:'최종보고서.txt',next:'20261001_사회_설문보고서.txt'},{old:'진짜최종.txt',next:'20261005_사회_설문보고서.txt'},{old:'그래프.csv',next:'20261005_수학_점수그래프.csv'}];let result=[];
 function reset(){const body=$('#file-rows');body.innerHTML=initial.map((r,i)=>`<tr><td>${esc(r.old)}</td><td><input aria-label="${esc(r.old)}의 새 이름" data-next="${i}" value="${esc(r.next)}"></td><td data-status="${i}"></td></tr>`).join('');$$('[data-next]').forEach(n=>n.oninput=()=>{$('#download-mapping').disabled=true;$('#rename-status').textContent='이름을 수정했어요. 대응표를 다시 검사하세요.';});check();}
 function check(){result=renamePlan(initial.map((r,i)=>({...r,next:$(`[data-next="${i}"]`).value.trim()})));result.forEach((r,i)=>{$(`[data-status="${i}"]`).textContent=r.error||r.status;});const errors=result.filter(r=>r.error);$('#download-mapping').disabled=!!errors.length;$('#rename-status').textContent=errors.length?errors.length+'개 항목을 고친 뒤 다시 검사하세요.':'3개 이름 확인 완료. 실제 파일 존재 여부는 실행 코드에서 다시 확인해요.';}
 $('#rename-check').onclick=check;$('#reset-files').onclick=reset;$('#duplicate-demo').onclick=()=>{$('[data-next="1"]').value=$('[data-next="0"]').value;check();};$('#download-mapping').onclick=()=>{check();if(result.some(r=>r.error))return;download(safeCSV([['old','new'],...result.map(r=>[r.old,r.next])]),'mapping.csv','text/csv;charset=utf-8');};reset();
}
if(type==='interview'){
 let remaining=60,deadline=0,timer=null;
 function display(){$('#timer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');}
 function stop(){clearInterval(timer);timer=null;$('#timer-start').disabled=false;}
 function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));display();if(!remaining){stop();$('#timer-status').textContent='60초가 지났어요. 설명을 돌아보세요.';}}
 $('#timer-start').onclick=()=>{if(timer||!remaining)return;deadline=Date.now()+remaining*1000;timer=setInterval(tick,200);$('#timer-start').disabled=true;$('#timer-status').textContent='연습 중';};
 $('#timer-stop').onclick=()=>{if(timer)tick();stop();$('#timer-status').textContent='잠시 멈췄어요.';};$('#timer-reset').onclick=()=>{stop();remaining=60;display();$('#timer-status').textContent='다시 60초부터 시작할 수 있어요.';};
 function prompt(){const q=$('#question').value;$('#active-question').textContent=q;$('#interview-prompt').textContent='아래 가상 활동으로 말하기 연습을 하려고 해.\n한 번에 질문 하나만 제시하고 내 답변 뒤에 꼬리 질문 하나를 제시해 줘.\n기록에 없는 성과·역할·수치를 추가하지 마. 합격 가능성은 평가하지 마.\n\n가상 활동: '+$('#activity').textContent+'\n첫 질문: '+q;}
 $('#question').onchange=prompt;$('#copy-interview').onclick=()=>copy($('#interview-prompt').textContent);prompt();
}
