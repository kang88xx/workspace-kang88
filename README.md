# Workspace Kang88

개인 업무, AI 업무, 할 일을 하나의 입체 공간에서 관리하는 대시보드 초안입니다. 화면에서 사용하는 **Orbit**는 이 프로젝트의 임시 이름입니다.

- 사용자 도메인: https://workspace.kang88.io
- GitHub: https://github.com/kang88xx/workspace-kang88
- 기본 배포 주소: https://orbit-personal-workspace.kangcommon88.chatgpt.site

## 로컬 실행

Node.js 22 이상에서 별도 의존성 설치 없이 실행할 수 있습니다.

```bash
git clone https://github.com/kang88xx/workspace-kang88.git
cd workspace-kang88
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다. `PORT` 환경 변수로 포트를 변경할 수 있습니다.

## 포함된 기능

- 개인 데스크, AI 랩, 데일리 플래너로 구성된 입체 업무 공간
- 업무 추가·수정·완료·삭제 및 되돌리기
- 공간, 통계, 업무 목록에 즉시 반영되는 상태
- 업무 검색, 유형별 보기, 집중 타이머, 배율 및 애니메이션 제어
- 모바일 화면과 모션 감소 설정 지원

AI 진행은 **시뮬레이션**이며 실제 GPT·Claude API는 연결되어 있지 않습니다. 업무 데이터는 현재 브라우저의 localStorage에만 저장되며 기기 간 동기화되지 않습니다. 브라우저 데이터를 지우면 업무 데이터도 삭제됩니다. 집중 타이머는 페이지를 닫으면 초기화됩니다.

## 구조

- `dist/`: 배포 가능한 HTML, CSS, JavaScript와 아이콘
- `server.mjs`: 로컬 개발용 정적 서버
- `tests/`: 상태와 브라우저 동작 검사
- `DESIGN.md`: 디자인 기준과 다음 단계의 미결정 사항
- `.openai/hosting.json`: 기존 Sites 배포 식별자와 정적 파일 경로

## 검증

```bash
npm run check
npm test
```

브라우저 검증에는 실행 중인 로컬 서버와 Playwright가 필요합니다. Playwright는 앱의 런타임 의존성이 아닙니다.

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser.mjs
```

## 배포

현재 정적 파일은 ChatGPT Sites에서 호스팅하며, DNS는 `kang88.io`의 Vercel DNS에서 관리합니다. 사용자 도메인 연결은 DNS 및 TLS 검증이 완료되어야 활성화됩니다. 기존 사이트의 접근 범위는 유지합니다.

이 GitHub 저장소는 소스 관리용입니다. **GitHub에 push하는 것만으로 Sites가 자동 배포되지는 않습니다.** Sites의 기존 프로젝트에 검증한 소스를 저장하고 배포하는 절차가 필요합니다. 호스팅을 변경할 경우 `dist/`를 정적 웹 호스트에 배포할 수 있습니다.

서비스 인증 정보와 토큰은 저장소에 포함하지 않습니다.
