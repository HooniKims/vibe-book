# 요즘 바이브코딩

수도여자고등학교 1·2학년을 위한 진로·입시 연계 가이드북.

**[전자책 읽기](https://hoonikims.github.io/vibe-book/)** · **[PDF 받기](https://hoonikims.github.io/vibe-book/guidebook.pdf)** · **[원고 바로 수정](https://github.com/HooniKims/vibe-book/edit/main/book.md)**

## 다음에 수정할 때

1. 위 **원고 바로 수정**을 엽니다.
2. `book.md`에서 문장을 고치고 **Commit changes**로 저장합니다.
3. [Actions](https://github.com/HooniKims/vibe-book/actions)의 초록색 완료 표시를 확인합니다. 전자책과 PDF가 함께 갱신됩니다.

배포 주소는 그대로 유지됩니다. 이전 내용은 GitHub의 History에서 확인할 수 있습니다. 원고의 `##`는 목차, `###`는 소제목, 세 개의 백틱으로 감싼 글은 복사 가능한 요청문입니다. 화면 디자인은 `web/reader.css`, 기능은 `web/reader.js`, 책 생성은 `build.py`에서 수정합니다. `dist/`는 자동 생성되므로 직접 수정하지 않습니다.

## 읽기 기능

- PC: 두 쪽 펼침, 페이지 이동, 확대, 전체 화면
- 휴대폰: 화면 폭에 맞춘 읽기 모드, 글자 크기 조절, 한 쪽 책 보기
- 목차, 본문 검색, 책갈피, 요청문 복사, PDF 내려받기
- 읽던 위치와 책갈피는 해당 브라우저에 저장됩니다.
- 로그인·서버·분석 추적 도구가 없습니다. 글꼴과 도식도 HTML에 포함됩니다.

## 내 컴퓨터에서 만들기

Python 3.11 이상과 Chrome을 사용합니다.

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build.py
python export_pdf.py
python -m http.server 8000 --directory dist
```

브라우저에서 `http://localhost:8000`을 엽니다. Windows에서는 가상환경 활성화 명령이 `.venv\Scripts\activate`입니다. HTML만 필요하면 PDF 명령은 생략할 수 있습니다. `dist/index.html`을 직접 열어도 읽을 수 있지만, 휴대폰에서는 배포 주소로 여는 것이 편합니다.

GitHub Actions는 본문 누락과 페이지 넘침을 검사한 뒤 `main`의 결과를 GitHub Pages에 배포합니다. PDF는 매번 같은 원고로 자동 생성합니다. 사이트 주소의 `#p=7`처럼 쪽 번호를 붙여 공유할 수 있습니다. 원고 수정으로 페이지 수가 달라지면 쪽 번호도 바뀔 수 있습니다.

## 글꼴

Paperlogy Regular/Bold를 사용합니다. 글꼴의 저작권·SIL Open Font License 전문은 [fonts/OFL.txt](fonts/OFL.txt)에 있습니다. 이 글꼴 라이선스는 강의 원고의 이용 조건을 정하지 않습니다.

개정: 2026년 10월 18일. 서비스 설치·이용 조건은 원고 끝의 공식 참고 링크에서 다시 확인하세요.
