# 요즘 바이브코딩

수도여자고등학교 1·2학년을 위한 강의 미리읽기와 선택 따라하기. 『관점을 디자인하라』에서 출발해 익숙한 일을 질문으로 바꾸고, 학과 비교·성적 분석·파일 정리로 시험합니다. 결과를 확인하며 도메인 지식과 공부의 필요성으로 이어집니다.

**[강의 허브](https://hoonikims.github.io/vibe-book/)** · **[전자책 읽기](https://hoonikims.github.io/vibe-book/reader.html)** · **[PDF 받기](https://hoonikims.github.io/vibe-book/guidebook.pdf)** · **[원고 바로 수정](https://github.com/HooniKims/vibe-book/edit/main/book.md)**

## 다음에 수정할 때

1. 위 **원고 바로 수정**을 엽니다.
2. `book.md`에서 문장을 고치고 **Commit changes**로 저장합니다.
3. [Actions](https://github.com/HooniKims/vibe-book/actions)의 초록색 완료 표시를 확인합니다. 전자책과 PDF가 함께 갱신됩니다.

배포 주소는 그대로 유지됩니다. 이전 내용은 GitHub의 History에서 확인할 수 있습니다. 원고의 `##`는 목차, `###`는 소제목, 세 개의 백틱으로 감싼 글은 복사 가능한 요청문입니다. 화면 디자인은 `web/reader.css`, 기능은 `web/reader.js`, 책 생성은 `build.py`에서 수정합니다. `dist/`는 자동 생성되므로 직접 수정하지 않습니다.

## 읽기 기능

- PC: 두 쪽 펼침, 종이가 책등을 축으로 넘어가는 모션, 페이지 이동, 확대, 전체 화면
- 휴대폰: 화면 폭에 맞춘 읽기 모드, 글자 크기 조절, 한 쪽 책 보기, 좌우 스와이프(책 보기: 쪽 넘김 / 읽기 모드: 한 화면 이동)
- 책 보기의 버튼·방향키·스와이프에 방향별 넘김 모션. 기기의 동작 줄이기 설정에서는 즉시 전환합니다.
- 목차, 본문 검색, 책갈피, 요청문 복사, PDF 내려받기
- 읽던 위치와 책갈피는 해당 브라우저에 저장됩니다.
- 로그인·서버·분석 추적 도구가 없습니다. 글꼴·도식·강의 삽화도 HTML에 포함됩니다.

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

브라우저에서 `http://localhost:8000`을 엽니다. Windows에서는 가상환경 활성화 명령이 `.venv\Scripts\activate`입니다. HTML만 필요하면 PDF 명령은 생략할 수 있습니다. `dist/reader.html`을 직접 열어도 책을 읽을 수 있지만, 휴대폰에서는 배포 주소로 여는 것이 편합니다.

GitHub Actions는 본문 누락과 페이지 넘침을 검사한 뒤 `main`의 결과를 GitHub Pages에 배포합니다. PDF는 매번 같은 원고로 자동 생성합니다. 전자책 주소의 `reader.html#p=7`처럼 쪽 번호를 붙여 공유할 수 있습니다. 원고 수정으로 페이지 수가 달라지면 쪽 번호도 바뀔 수 있습니다.

## 글꼴

제목은 Paperlogy, 본문은 Pretendard를 사용합니다. 본문 글꼴을 필요한 문자로 서브셋하고 수정본 이름을 VibeText로 지정했습니다. 원본 글꼴과 SIL Open Font License 전문은 [Paperlogy](fonts/OFL.txt), [Pretendard](fonts/OFL-Pretendard.txt)에 있습니다. 이 글꼴 라이선스는 강의 원고의 이용 조건을 정하지 않습니다.

개정: 2026년 10월 19일. 서비스 설치·이용 조건은 원고 끝의 공식 참고 링크에서 다시 확인하세요.

## 예제와 강의 자료

`examples/`에는 가상 CSV, 강사가 준비한 그래프 보고서, 표준 Python으로 보고서를 만드는 코드가 있습니다. `assets/`에는 최신 강의 슬라이드의 삽화를 웹용으로 변환해 넣었습니다. `book.md`를 수정해도 PPTX가 자동으로 바뀌지는 않으므로 강의 내용 변경 시 슬라이드와 함께 확인하세요.


## 실행 예제 허브 개정

첫 화면은 허브이며 전자책은 `reader.html`로 이동했습니다. 예전 `/#p=7` 주소는 `reader.html#p=7`로 연결합니다. 원고 확장으로 실제 내용의 쪽수는 달라집니다.

- `scores.html`: CSV 검증, 빈칸/0점/범위 오류, 그래프, 보고서·자료 다운로드
- `major.html`: 공식 출처 확인, 관심·질문 편집, 선택한 학과 CSV, 내 후보 추가
- `files.html`: 파일명 대응표·충돌 검사, 미리보기·적용 코드와 연습 ZIP
- `interview.html`: 질문 선택, 메모, 타이머, 복사 전 요청문 확인
- `tools.html`, `prompts.html`: 도구 안내, 개발창 형태의 요청 예시, 전체 복사

허브를 수정할 때는 `build_hub.py`, `hub/hub.css`, `hub/hub.mjs`를 고칩니다. 계산·검증 로직은 `hub/core.mjs`입니다. 요청문 원본은 `prompts/prompts.json`과 각 TXT입니다. 실제 실행 화면은 `screenshots/`, 강의용 확대 화면은 `screenshots/lecture/`에 있습니다. 재구성 요청 이미지를 실제 서비스 실행 기록으로 표시하지 않습니다.

`node --test tests/core.test.mjs`와 `python -m unittest discover -s tests -p 'test_*.py'`를 실행한 뒤 빌드하세요. `tools/capture*.mjs`와 `tools/verify-browser.mjs`는 제작 환경의 Playwright·Chrome으로 캡처와 브라우저 검증에 사용했습니다. 별도 환경에서는 Playwright 설치 경로를 맞추세요. PDF 출력은 전자책 `reader.html`을 기준으로 합니다.

앱에서 입력한 값은 브라우저 안에서 처리하고 저장하거나 전송하지 않습니다. 필요하면 다운로드하세요. 파일 정리는 웹에서 실제 파일을 변경하지 않습니다. ZIP의 코드는 기본 미리보기이며 `--apply`를 지정할 때만 연습 파일 이름을 변경합니다.

넘김 동작 검수: 로컬 서버를 실행한 뒤 `node tools/verify-page-turn.mjs`. PC 앞뒤 넘김·연속 조작·모드 전환·키보드·처음/마지막 쪽·동작 줄이기·모바일 스와이프를 확인합니다.
