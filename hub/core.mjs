export function parseCSV(text) {
  const rows=[]; let row=[],cell='',quoted=false,closed=false;
  text=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  for(let i=0;i<text.length;i++) {const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
    else if(c==='"'){if(cell||closed)throw Error('따옴표 위치를 확인하세요.');quoted=true;}
    else if(c===','||c==='\n'){row.push(cell);cell='';closed=false;if(c==='\n'){if(row.some(x=>x.trim()))rows.push(row);row=[];}}
    else {if(closed&&c.trim())throw Error('닫는 따옴표 뒤의 값을 확인하세요.');if(!closed)cell+=c;}
  }
  if(quoted)throw Error('닫히지 않은 따옴표가 있어요.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
export function scoreData(text){
 const rows=parseCSV(text);if(rows.length<2)throw Error('제목 행과 과목별 점수를 넣어 주세요.');
 const header=rows.shift().map(x=>x.trim());if(header.join(',')!=='과목,시험1,시험2,시험3')throw Error('첫 줄은 과목,시험1,시험2,시험3 이어야 해요.');
 const seen=new Set();if(rows.length>20)throw Error('한 번에 20과목까지 비교해요.');
 return rows.map((r,i)=>{if(r.length!==4)throw Error(`${i+2}행의 열 개수가 달라요.`);const subject=r[0].trim();if(!subject||seen.has(subject))throw Error('과목 이름은 비어 있거나 중복될 수 없어요.');seen.add(subject);
 const values=r.slice(1).map((x,j)=>{x=x.trim();if(!x)return null;if(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(x)||Number(x)>100)throw Error(`${subject} 시험${j+1}: 0~100 사이의 숫자 또는 빈칸을 넣으세요.`);return Number(x);});
 return {subject,values,delta:values[0]===null||values[2]===null?null:Math.round((values[2]-values[0])*100)/100};});
}
export function safeCSV(rows){return '\uFEFF'+rows.map(r=>r.map(x=>{let s=String(x??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export function renamePlan(rows){
 const valid=n=>n&&n.length<=180&&!/[\\/:*?"<>|\x00-\x1f]/.test(n)&&!/[. ]$/.test(n)&&!/^\.{1,2}$/.test(n)&&! /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(n);
 const norm=n=>n.normalize('NFC').toLowerCase();const old=rows.map(r=>norm(r.old));const next=rows.map(r=>norm(r.next));
 return rows.map((r,i)=>{let error='';if(!valid(r.old)||!valid(r.next))error='파일 이름에 사용할 수 없는 글자가 있어요.';
 else if(old.filter(n=>n===old[i]).length>1)error='기존 이름이 중복돼요.';
 else if(next.filter(n=>n===next[i]).length>1)error='새 이름이 겹쳐요.';
 else if(r.old.slice(r.old.lastIndexOf('.')).toLowerCase()!==r.next.slice(r.next.lastIndexOf('.')).toLowerCase())error='확장자를 유지하세요.';
 else if(next[i]!==old[i]&&old.includes(next[i]))error='다른 파일의 기존 이름과 겹쳐요.';
 return {...r,error,status:error?'확인 필요':r.old===r.next?'변경 없음':'미리보기 OK'};});
}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
