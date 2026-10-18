# /// script
# requires-python = ">=3.11"
# dependencies = ["markdown", "beautifulsoup4", "fonttools", "brotli"]
# ///
from pathlib import Path
import re, json, base64, html, shutil, io, mimetypes
import markdown
from bs4 import BeautifulSoup
from fontTools import subset
from fontTools.ttLib import TTFont
R=Path(__file__).resolve().parent;OUT=R/'dist';OUT.mkdir(exist_ok=True)
S=R/'web';src=R/'book.md'
source=src.read_text();source=re.sub(r'<!-- HUMANIZE-SUMMARY -->[\s\S]*','',source).strip()
source=re.sub(r'\n\*\*내가 원하는 작업을, 내 방식으로\*\*','',source,count=1)
# Markdown table links are clickable in the reader.
def diagram(kind):
 if kind=='작업흐름':
  cards=[('01','작업 정하기','내가 필요한 결과'),('02','요청문 쓰기','자료와 조건'),('03','실행하기','직접 열어 보기'),('04','확인·수정','자료와 대조하기')]
  body=''.join(f'<rect x="{i*124+1}" y="10" width="114" height="112" rx="8" fill="{["#e7eee2","#f5df84","#dcebe8","#f9e0d3"][i]}"/><text x="{i*124+14}" y="36" font-size="13" fill="#28644c">{num}</text><text x="{i*124+14}" y="66" font-size="17" font-weight="700">{title}</text><text x="{i*124+14}" y="95" font-size="10">{sub}</text>' for i,(num,title,sub) in enumerate(cards))
  return f'<svg viewBox="0 0 500 136" role="img" aria-label="작업을 정하고 요청문을 작성해 실행한 뒤 확인하고 수정하는 순서" xmlns="http://www.w3.org/2000/svg"><g font-family="Paperlogy,sans-serif" fill="#202824">{body}</g></svg>'
 else:
  return '''<svg viewBox="0 0 500 260" role="img" aria-label="가상 원점수: 수학 72, 78, 81점. 영어 86, 82, 84점. 세로축 0부터 100점." xmlns="http://www.w3.org/2000/svg"><rect width="500" height="260" rx="12" fill="#f0f3eb"/><g font-family="Paperlogy,sans-serif" font-size="12" fill="#556157"><text x="25" y="25">수업용 가상 원점수 · 100점 만점</text><path d="M55 45V210H450 M55 127H450 M55 45H450" fill="none" stroke="#cdd7c6"/><text x="25" y="49">100</text><text x="31" y="131">50</text><text x="38" y="213">0</text><text x="91" y="235">시험 1</text><text x="241" y="235">시험 2</text><text x="391" y="235">시험 3</text><path d="M110 91.2L260 81.3L410 76.35" fill="none" stroke="#28644c" stroke-width="3"/><path d="M110 68.1L260 74.7L410 71.4" fill="none" stroke="#bc664c" stroke-width="3" stroke-dasharray="7 4"/><g fill="#28644c"><circle cx="110" cy="91.2" r="5"/><circle cx="260" cy="81.3" r="5"/><circle cx="410" cy="76.35" r="5"/><text x="102" y="114">72</text><text x="252" y="105">78</text><text x="403" y="101">81</text></g><g fill="#bc664c"><circle cx="110" cy="68.1" r="5"/><circle cx="260" cy="74.7" r="5"/><circle cx="410" cy="71.4" r="5"/><text x="102" y="57">86</text><text x="252" y="62">82</text><text x="403" y="59">84</text></g><text x="288" y="178" fill="#28644c">━ 수학 +9점</text><text x="288" y="198" fill="#bc664c">┄ 영어 −2점</text></g></svg>'''
source=re.sub(r'!\[([^\]]*)\]\(도식 ([^)]*)\)',lambda m:f'<figure>{diagram(m[2])}<figcaption>{html.escape(m[1])}</figcaption></figure>',source)
def asset_uri(path):
 return 'data:'+mimetypes.guess_type(path)[0]+';base64,'+base64.b64encode((R/path).read_bytes()).decode()
def illustration(m):
 return f'<figure class="slide-art"><img src="{asset_uri(m[2])}" alt="{html.escape(m[1])}" width="1000" height="667"><figcaption>{html.escape(m[1])}</figcaption></figure>'
source=re.sub(r'!\[([^\]]*)\]\((assets/[^)]+)\)',illustration,source)
source=re.sub(r'!\[([^\]]*)\]\((screenshots/[^)]+)\)',lambda m:f'<figure class="screen-shot"><a href="{m[2]}" target="_blank" rel="noopener"><img src="{asset_uri(m[2])}" alt="{html.escape(m[1])}"></a><figcaption>{html.escape(m[1])} · 그림을 누르면 크게 볼 수 있어요</figcaption></figure>',source)
# Skip the title/metadata block: it is typeset on the custom cover.
source=source[source.index('## 한 페이지 요약'):]
# Keep lists following short labels as real lists in the rendered book.
lines=[];fenced=False
for line in source.splitlines():
 if line.startswith('```'):fenced=not fenced
 if not fenced and re.match(r'^(?:[-*] |\d+\. )',line) and lines and lines[-1].strip() and not re.match(r'^(?:[-*] |\d+\. |    )',lines[-1]):lines.append('')
 lines.append(line)
source='\n'.join(lines)
soup=BeautifulSoup(markdown.markdown(source,extensions=['tables','fenced_code','sane_lists']), 'html.parser')
for hr in soup.find_all('hr'):hr.decompose()
# Korean particles can follow Latin abbreviations without spaces.
for t in list(soup.find_all(string=re.compile(r'\*\*[^*]+\*\*'))):
 if t.find_parent(['pre','code']):continue
 t.replace_with(BeautifulSoup(re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',html.escape(str(t))),'html.parser'))
for t in list(soup.find_all(string=re.compile(r'https://'))):
 if t.find_parent(['a','pre','code']):continue
 st=re.sub(r'https://[^\s<>]+',lambda m:f'<a href="{html.escape(m[0])}">{html.escape(m[0])}</a>',html.escape(str(t)));t.replace_with(BeautifulSoup(st,'html.parser'))
for a in soup.find_all('a'):
 if a.get('href','').startswith('http'):a['target']='_blank';a['rel']='noopener noreferrer'
for table in list(soup.find_all('table')):
 wrapper=soup.new_tag('div',attrs={'class':'table-scroll','tabindex':'0','role':'region','aria-label':'표: 가로로 이동해서 읽을 수 있습니다'});table.wrap(wrapper)
for pre in list(soup.find_all('pre')):
 box=soup.new_tag('div',attrs={'class':'codebox'});pre.wrap(box)
 is_csv=pre.code and 'language-csv' in pre.code.get('class',[])
 is_command=pre.code and any(c in pre.code.get('class',[]) for c in ['language-bash','language-sh','language-shell'])
 code_label='예제 CSV · 파일로 저장하세요' if is_csv else ('터미널 명령 · 폴더를 확인하고 실행하세요' if is_command else '요청문 · 복사해서 조건을 채우세요')
 label=soup.new_tag('div',attrs={'class':'code-label'});span=soup.new_tag('span');span.string=code_label;label.append(span)
 button=soup.new_tag('button',attrs={'type':'button','class':'copy','data-copy':pre.get_text(),'aria-label':'예제 CSV 전체 복사' if is_csv else ('터미널 명령 전체 복사' if is_command else '요청문 전체 복사')});button.string='복사';label.append(button);box.insert(0,label)
for p in soup.find_all('p'):
 if p.get_text().startswith('✓'):p['class']='success'
 elif p.get_text().startswith('막히면:'):p['class']='help'
# Chapter sections provide stable contents and reading anchors.
sections=[];current=None
for node in list(soup.contents):
 if not getattr(node,'name',None):continue
 if node.name=='h2':
  current=soup.new_tag('section',attrs={'id':f'chapter-{len(sections)+1}'});sections.append(current)
 if current is not None:current.append(node.extract())
block=0
for section in sections:
 for el in section.children:
  if getattr(el,'name',None):el['data-block']=f'b{block}';block+=1
content=''.join(str(x) for x in sections)
cover='''<div class="cover-inner"><div class="cover-label">수도여자고등학교 1·2학년 · 실천 가이드북</div><h1>요즘<br>바이브코딩<span style="color:var(--yellow)">.</span></h1><p class="cover-sub">내가 원하는 작업을,<br>내 방식으로.</p><div class="cover-art" aria-label="학과 탐색, 성적 분석, 면접 연습"><div class="cover-card"><b>나와 맞는 학과</b><span>이름보다, 실제로 배우는 수업부터.</span></div><div class="cover-card"><b>내 성적의 변화</b><span>숫자를 읽고 다음 공부를 정하기.</span><div class="card-graph" aria-hidden="true"><i style="height:12px"></i><i style="height:22px"></i><i style="height:29px"></i></div></div><div class="cover-card"><b>내 활동 설명하기</b><span>내가 한 일을 내 말로.</span></div><div class="seal">READ<br>TRY<br>CHECK</div></div><div class="cover-footer"><span>수도여자고등학교<br>김형훈</span><span>2026<br>진로·입시 연계 개정판</span></div></div>'''
icons={'menu':'M4 6h16M4 12h16M4 18h16','search':'M21 21l-5-5 M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15','bookmark':'M6 3h12v18l-6-4-6 4z','full':'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5','print':'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7z','close':'M5 5l14 14M19 5L5 19','left':'M15 5l-7 7 7 7','right':'M9 5l7 7-7 7'}
cover=re.sub(r'<div class="cover-art"[\s\S]*?<div class="cover-footer">',f'<div class="cover-illustration"><img src="{asset_uri("assets/cover.webp")}" alt="강의 표지의 학생과 로봇 캐릭터"><span>학과 비교 · 성적 분석 · 파일 정리</span></div><div class="cover-footer">',cover)
cover=cover.replace('실천 가이드북','강의 미리읽기 & 선택 가이드').replace('진로·입시 연계 개정판','작업 중심 개정판')
def icon(name):return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{icons[name]}"/></svg>'
# Only required characters are embedded, including dynamic reader labels.
labels='목차검색책갈피복사했어요현재쪽전체화면이전다음찾은내용없읽기보기페이지글자크기인쇄요청문지원브라우저1234567890–…가나다라마바사아자차카타파하'
alltext=BeautifulSoup(content+cover,'html.parser').get_text()+labels+(S/'reader.js').read_text()
fontcss=''
for weight,name in [(400,'4Regular'),(700,'7Bold')]:
 font=TTFont(R/'fonts'/('Paperlogy-'+name+'.ttf'));options=subset.Options();options.flavor='woff2';options.layout_features=['*'];sub=subset.Subsetter(options=options);sub.populate(text=alltext);sub.subset(font);font.flavor='woff2';buf=io.BytesIO();font.save(buf)
 fontcss+=f"@font-face{{font-family:Paperlogy;font-style:normal;font-weight:{weight};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(buf.getvalue()).decode()}) format('woff2')}}"
for weight,name in [(400,'Regular'),(700,'SemiBold')]:
 font=TTFont(R/'fonts'/f'Pretendard-{name}.otf')
 # SIL OFL permits modification; the subset uses a new family name.
 for rec in font['name'].names:
  if rec.nameID in (1,3,4,6,16):rec.string=('VibeText-'+name if rec.nameID in (3,4,6) else 'VibeText').encode(rec.getEncoding())
 if 'CFF ' in font:
  cff=font['CFF '].cff;cff.fontNames=['VibeText-'+name]
  for top in cff.topDictIndex:top.FamilyName='VibeText';top.FullName='VibeText '+name
 options=subset.Options();options.layout_features=['*'];sub=subset.Subsetter(options=options);sub.populate(text=alltext);sub.subset(font);font.flavor='woff2';buf=io.BytesIO();font.save(buf)
 fontcss+=f"@font-face{{font-family:VibeText;font-style:normal;font-weight:{weight};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(buf.getvalue()).decode()}) format('woff2')}}"
css=fontcss+(S/'reader.css').read_text();js=(S/'reader.js').read_text()
page=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#183f31"><meta name="description" content="수도여고 1·2학년을 위한 바이브코딩 가이드북. 학과 비교·성적 분석·파일 정리 사례로 미리 읽는 강의와 수업 뒤 선택 가이드."><title>요즘 바이브코딩 · 수도여고 전자책</title><style>{css}</style></head><body>
<a class="skip" href="#app-content">본문으로 이동</a>
<header class="topbar" id="topbar"><button id="menu" class="icon menu-button" aria-label="목차 열기">{icon('menu')}</button><div class="brand"><span class="brand-mark" aria-hidden="true">v.</span><div><strong>요즘 바이브코딩</strong><small>수도여고 · 내가 원하는 작업을, 내 방식으로</small></div></div><div class="tools"><a class="hub-link" href="index.html">허브</a><div class="mode-switch" aria-label="보기 방식"><button data-mode="book" aria-pressed="false">책 보기</button><button data-mode="read" aria-pressed="false">읽기 모드</button></div><div class="font-control" id="font-control" hidden><button id="font-minus" aria-label="글자 작게">가−</button><button id="font-plus" aria-label="글자 크게">가+</button></div><button id="search-open" class="icon" aria-label="책에서 검색">{icon('search')}</button><button id="bookmark" class="icon" aria-pressed="false" aria-label="현재 쪽 책갈피">{icon('bookmark')}</button><button id="fullscreen" class="icon" aria-label="전체 화면">{icon('full')}</button><button id="print" class="icon print-button" aria-label="인쇄 또는 PDF 저장">{icon('print')}</button></div></header>
<div id="loading" class="loading" role="status">책을 펼치고 있어요.</div><main id="app-content" hidden><div id="book-area" class="book-area"><div class="book-wrap" id="book-wrap"><div id="spread" class="spread"></div></div></div><article class="reading" id="reading" aria-label="스크롤로 읽는 본문"></article></main>
<footer class="bottom" id="bottom"><div class="progress-wrap"><div class="chapter-current" id="chapter-current">표지</div><div class="progress"><i id="progress-fill"></i></div></div><div class="zoom-controls"><button id="zoom-out" aria-label="책 축소">−</button><button id="zoom-value" title="화면에 맞추기" aria-label="확대 비율 초기화">100%</button><button id="zoom-in" aria-label="책 확대">+</button></div><div class="pagination"><button id="first" class="icon desktop-label" aria-label="처음 쪽">⇤</button><button id="prev" class="icon" aria-label="이전 쪽">{icon('left')}</button><form id="page-form" class="pageform"><label for="page-number" class="hidden">이동할 쪽수</label><input id="page-number" type="number" min="1" value="1" aria-label="이동할 쪽수"><span id="total-pages"></span></form><button id="next" class="icon" aria-label="다음 쪽">{icon('right')}</button><button id="last" class="icon desktop-label" aria-label="마지막 쪽">⇥</button></div><span id="page-status" class="sr-only" aria-live="polite"></span></footer>
<div class="overlay" id="overlay" hidden></div><aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-label="목차와 책갈피" hidden><div class="drawer-head"><h2>다시 펼쳐 볼 곳</h2><button class="icon" id="drawer-close" aria-label="목차 닫기">{icon('close')}</button></div><div class="drawer-tabs" role="tablist" aria-label="목록 선택"><button id="contents-tab" role="tab" aria-selected="true">목차</button><button id="bookmarks-tab" role="tab" aria-selected="false">책갈피</button></div><nav id="toc" aria-label="책 목차"></nav><p class="tip"><a href="guidebook.pdf" download>가이드북 PDF 받기</a> · <a href="book.md" download>원고 받기</a> · <a href="downloads/recommended-book.pdf" download>추천도서 안내</a></p><p class="tip">읽던 위치와 책갈피는 이 브라우저에만 저장돼요. 다른 기기와 자동으로 공유되지 않습니다.</p></aside>
<dialog id="search-dialog" aria-labelledby="search-title"><div class="dialog-head"><h2 id="search-title">책에서 찾아보기</h2><button id="search-close" class="icon" aria-label="검색 닫기">{icon('close')}</button></div><label for="search-input" class="hidden">검색어</label><input id="search-input" class="search-input" type="search" placeholder="학과, 성적, 타이머…" autocomplete="off"><p id="search-count" class="footnote" aria-live="polite"></p><div id="results" class="results"></div></dialog>
<dialog id="copy-dialog" aria-labelledby="copy-title"><div class="dialog-head"><h2 id="copy-title">요청문 직접 복사</h2><button id="copy-close" class="icon" aria-label="복사 창 닫기">{icon('close')}</button></div><p>선택된 글을 길게 누르거나 Ctrl+C / ⌘C로 복사하세요.</p><textarea id="copy-text" aria-label="복사할 요청문" readonly style="width:100%;height:300px;padding:14px;font:inherit;line-height:1.7"></textarea></dialog>
<div class="toast" id="toast" role="status" hidden></div><div id="measurement" aria-hidden="true"></div><div id="print-pages" aria-hidden="true"></div><template id="cover-template">{cover}</template><template id="source">{content}</template><noscript><div class="noscript"><h1>요즘 바이브코딩</h1><p>페이지 넘김에는 JavaScript가 필요합니다. 아래에서 본문을 읽을 수 있습니다.</p>{content}</div></noscript><script>{js}</script></body></html>'''
(OUT/'reader.html').write_text(page)
(OUT/'요즘바이브코딩_전자책.html').write_text(page)
(OUT/'.nojekyll').touch()
shutil.copy2(R/'fonts/OFL.txt',OUT/'font-license.txt')
shutil.copy2(R/'fonts/OFL-Pretendard.txt',OUT/'font-license-pretendard.txt')
for folder in ['examples','assets','downloads']:
 if (R/folder).is_dir():shutil.copytree(R/folder,OUT/folder,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
shutil.copy2(src,OUT/'book.md')
soup=BeautifulSoup(content,'html.parser')
report={'source':str(src.relative_to(R)),'characters':len(src.read_text()),'chapters':[x.h2.get_text() for x in sections],'headings':len(soup.find_all(re.compile('^h[234]$'))),'codeblocks':len(soup.find_all('pre')),'tables':len(soup.find_all('table')),'externalLinks':sorted(set(a['href'] for a in soup.find_all('a') if a.get('href','').startswith('http'))),'htmlBytes':len(page.encode())}
(R/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))

from build_hub import build as build_hub
build_hub(OUT)
