# Veil (베일)

> 블라인드 콘텐츠 디스커버리 플랫폼

소비자는 제목·창작자·장르 없이 티저 영상만 보고 반응합니다. 관심을 누른 후에야 콘텐츠 정보가 공개됩니다.

---

## 핵심 개념

- **블라인드 원칙** — 관심 표시 전까지 제목·창작자·장르 등 메타데이터 비공개
- **티저 피드** — 풀스크린 세로 영상. 스와이프 업 = 패스, 하트 탭 = 관심(정보 공개)
- **익명 통계** — 창작자는 소비자의 연령대·성별·지역 분포만 확인 (실명·연락처 비공개)
- **외부 안내** — 창작자가 관심 소비자에게 링크·메시지 일괄 발송 (3일 내 최대 2회)

---

## 사용자 역할

| 역할 | 주요 흐름 |
|---|---|
| **소비자** | 온보딩 → 블라인드 피드 → 관심 → 콘텐츠 정보 공개 → 외부 안내 수신 |
| **창작자** | 티저 업로드 → 심사 대기 → 대시보드 (노출·관심 통계) → 외부 안내 발송 |
| **관리자** | 심사 대기 목록 → 상세 검토 → 승인 / 반려 |

---

## 기술 스택

- **Frontend** — Vite + React 19 + TypeScript, CSS Modules
- **Routing** — React Router v6 (역할별 가드)
- **Auth** — JWT Bearer + localStorage 세션 유지
- **API** — REST (`/api/v1`), 파일 업로드는 multipart/form-data

---

## 프로젝트 구조

```
veil_frontend/src/
  types/index.ts          # 도메인 타입 정의
  context/auth.tsx        # AuthContext (login/logout/setUser)
  services/api.ts         # 타입 안전 fetch 래퍼 + 전체 API
  router/index.tsx        # RequireAuth, RequireGuest 가드
  layouts/                # AuthLayout / ConsumerLayout / CreatorLayout / AdminLayout
  pages/
    auth/                 # 로그인, 회원가입
    consumer/             # 온보딩, 피드, 콘텐츠 상세, 관심 목록, 알림, 설정
    creator/              # 대시보드, 업로드, 콘텐츠 목록, 소비자 통계, 안내 발송, 알림
    admin/                # 심사 목록, 심사 상세
```

---

## 시작하기

```bash
cd veil_frontend
npm install
npm run dev        # http://localhost:5173
```

### 환경 변수 (`veil_frontend/.env`)

```env
VITE_API_URL=http://<백엔드 IP>:8000
```

### 같은 네트워크에서 접속

```bash
npm run dev -- --host
# Network: http://<내 IP>:5173
```

---

## 주요 명령어

```bash
npm run build      # 타입 체크 + 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
npm run lint       # ESLint
```

---

## 콘텐츠 상태 흐름

```
pending → approved
        → rejected
```

심사는 관리자 페이지에서 처리합니다.
