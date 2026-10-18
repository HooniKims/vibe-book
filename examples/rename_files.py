"""Preview by default. Apply an explicit mapping only inside this practice folder."""
from pathlib import Path
import argparse,csv,os,re,sys
ROOT=Path(__file__).resolve().parent

def name_ok(name):
 return bool(name and len(name)<=180 and not re.search(r'[\\/:*?"<>|\x00-\x1f]',name) and name not in ('.','..') and not name.endswith(('.', ' ')) and not re.match(r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)',name,re.I))
def plan(root):
 with (root/'mapping.csv').open(encoding='utf-8-sig',newline='') as f:
  reader=csv.DictReader(f)
  if reader.fieldnames!=['old','new']:raise ValueError('mapping.csv의 열은 old,new 이어야 합니다.')
  rows=list(reader)
 if not rows:raise ValueError('대응표가 비어 있습니다.')
 keys=lambda col:[r[col].casefold() for r in rows]
 for col in ['old','new']:
  if len(set(keys(col)))!=len(rows):raise ValueError(f'{col} 이름이 중복됩니다.')
 for r in rows:
  if not all(name_ok(r[k]) for k in ['old','new']):raise ValueError('파일 이름만 사용하세요. 경로는 사용할 수 없습니다.')
  src,dst=root/r['old'],root/r['new']
  if src.is_symlink() or not src.is_file():raise ValueError(f'일반 파일을 찾을 수 없습니다: {src.name}')
  if src.suffix.lower()!=dst.suffix.lower():raise ValueError('확장자를 유지하세요.')
  if src!=dst and (dst.exists() or dst.is_symlink()):raise ValueError(f'새 이름이 이미 있습니다: {dst.name}')
 return rows

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--apply',action='store_true');args=ap.parse_args()
 try:
  rows=plan(ROOT)
  for r in rows:print(f'{r["old"]} -> {r["new"]}')
  if not args.apply:print('미리보기만 했습니다. 파일은 바뀌지 않았습니다.');return
  # Exclusive links prevent accidental overwrites even if a destination appears after validation.
  log=ROOT/'rename-log.csv'
  with log.open('x',encoding='utf-8-sig',newline='') as f:
   w=csv.writer(f);w.writerow(['old','new']);f.flush()
   for r in rows:
    src,dst=ROOT/r['old'],ROOT/r['new']
    if src==dst:continue
    os.link(src,dst)
    try:src.unlink()
    except Exception:dst.unlink();raise
    w.writerow([src.name,dst.name]);f.flush()
  print('완료. rename-log.csv에서 변경 기록을 확인하세요.')
 except (OSError,ValueError,KeyError) as e:sys.exit(f'중단: {e}')
if __name__=='__main__':main()
