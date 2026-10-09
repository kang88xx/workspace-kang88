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

## 주간 사용 한도 정책

AI 실행뿐 아니라 AI를 사용하는 결과 확인·감시에도 **주간 제공량만 사용**하는 규칙을 적용하도록 준비했습니다.

- 잔여량이 정확히 5%일 때는 경고하지 않고, **5% 미만**일 때 알립니다.
- **0%에서는 진행 중인 요청을 취소하고 새 요청도 차단**합니다.
- 추가 사용이 필요하면 작업을 보류하고 승인 모달을 표시합니다. 유료 크레딧이나 API 과금으로 자동 전환하지 않습니다.
- 미연결, 조회 실패, 오래된 사용량은 실행을 보류합니다. 갱신 예정 시각만으로 잔여량을 채우거나 멈춘 작업을 자동 재시작하지 않습니다.

현재 서비스는 연결되지 않았으므로 실제 사용량은 `—`로 표시합니다. **정책 · 동작 미리보기**는 별도 예시 데이터만 사용하며, 네트워크 요청·실제 토큰 사용·저장된 업무 변경이 없습니다. 서비스와 비용 정보가 없기 때문에 실제 추가 사용 승인은 비활성화했습니다.

`dist/weekly-quota.js`는 세 작업 유형에 공통으로 사용하는 차단 규칙과 실행 취소 처리를 담습니다. 실제 서비스를 연결할 때에는 신뢰할 수 있는 사용량 조회, 주간 제공량으로만 실행하는 경로, `AbortSignal`을 따르는 취소 처리를 **서버/실행기에도 연결해야 합니다**. 현재의 브라우저 정책과 미리보기만으로 외부 서비스의 사용량·과금이나 다른 기기의 실행을 제어하지는 않습니다. 토큰을 쓰지 않는 사용량 조회는 AI 호출 없이 처리하며, AI 추론을 동반하는 확인·감시는 이 규칙을 통과해야 합니다.

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
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/weekly-quota.browser.mjs
```

## 배포

현재 정적 파일은 ChatGPT Sites에서 호스팅하며, DNS는 `kang88.io`의 Vercel DNS에서 관리합니다. 사용자 도메인 연결은 DNS 및 TLS 검증이 완료되어야 활성화됩니다. 기존 사이트의 접근 범위는 유지합니다.

이 GitHub 저장소는 소스 관리용입니다. **GitHub에 push하는 것만으로 Sites가 자동 배포되지는 않습니다.** Sites의 기존 프로젝트에 검증한 소스를 저장하고 배포하는 절차가 필요합니다. 호스팅을 변경할 경우 `dist/`를 정적 웹 호스트에 배포할 수 있습니다.

서비스 인증 정보와 토큰은 저장소에 포함하지 않습니다.
