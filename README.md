## backend-schedule 서비스

간단 소개
- 이 저장소 폴더는 `backend-schedule` 서비스(Express + Node.js)입니다.
- 원래 MongoDB Atlas를 사용하던 스케줄(근무표) 관리 서비스를 Supabase(Postgres)로 마이그레이션하고 Render에 배포했습니다.

핵심 요약 (무엇을, 왜)
- MongoDB 사용을 중단하고 Supabase의 JSONB 컬럼을 이용해 스케줄 관련 데이터를 저장하도록 마이그레이션함.
- 단일 컷오버 방식으로 로컬에서 migration 스크립트를 실행(총 34개 문서 마이그레이션)한 뒤, 서버 코드를 Supabase 기반으로 전환하고 배포함.

현 상태 (Status)
- 서비스: Express 서버로 정상 동작 및 Render에 배포됨.
- 데이터베이스: Supabase(Postgres) `schedule_posts` 테이블 사용 (JSONB 필드: `unavailable`, `assignments`).
- 인증: Firebase ID token을 사용하는 인증 미들웨어(`middlewares/auth.js`) 적용.
- 마이그레이션: 로컬에서 완료 (34 문서). 마이그레이션 스크립트는 로컬 실행 후 저장소에서 제거/정리됨. 스키마 DDL은 `scripts/create_tables.sql`에 보존됨.

주요 변경사항(파일)
- `utils/supabaseClient.js` — Supabase 클라이언트 중앙화
- `services/scheduleService.js` — Mongo -> Supabase 쿼리로 전면 교체
- `middlewares/auth.js` — `FIREBASE_ADMIN_KEY` 파싱 안정화 및 Firebase Admin 초기화 보호 로직 추가
- `server.js` — MongoDB 연결/시작 로직 제거, Supabase 기반으로 동작
- `scripts/create_tables.sql` — 테이블 DDL 보관

환경 변수 (필수)
- SUPABASE_URL — Supabase 프로젝트 URL
- SUPABASE_SERVICE_ROLE_KEY — 서버 사이드(서비스 역할) 키 (비밀)
- FIREBASE_ADMIN_KEY — Firebase Admin 서비스 계정 JSON. Render나 호스팅의 환경변수에 넣을 때는 JSON 문자열(또는 줄바꿈 이스케이프 형태)로 넣을 수 있음. 미들웨어에서 여러 포맷(plain JSON, escaped `\\n` 포함 등)을 시도하여 파싱함.
- PORT — (호스팅 환경에서 자동으로 설정되지 않으면) 서버 포트

로컬 실행 (개발자용)
1) 환경 변수 설정 (macOS zsh 예)
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export FIREBASE_ADMIN_KEY='{"type":"service_account", ... }'  # 전체 JSON
export PORT=3001
```
2) 의존성 설치
```bash
npm install
```
3) 서버 시작
```bash
npm start
```

API 엔드포인트 (주요)
- POST /api/schedules/create — 스케줄(게시글) 생성 (인증 필요)
- GET /api/schedules?groupId={groupId} — 그룹별 스케줄 조회
- PUT /api/schedules/:scheduleId/unavailable — 유저 불가 날짜 제출 (인증 필요)
- PATCH /api/schedules/:scheduleId/confirm — 사장님 스케줄 확정 (인증 필요)
- GET /api/schedules/group/:groupId/today — 오늘 근무자 조회

마이그레이션 노트
- 마이그레이션 전략: 단일 컷오버(서비스 잠깐 다운) 방식 선택 — 로컬에서 데이터를 Supabase로 옮기고 코드 베이스를 Supabase 기반으로 전환.
- migration 스크립트(로컬 실행)는 한 번만 실행했고, 실행 후 저장소에서 제거하거나 보관하지 않음. 스키마 정의는 `scripts/create_tables.sql`에 유지.

디버깅/중요한 교훈
- Render에서 502/크래시 발생 원인: `FIREBASE_ADMIN_KEY` 환경변수 파싱 중 JSON.parse에서 실패(제대로 이스케이프되지 않은 줄바꿈 등). 해결: `middlewares/auth.js`에 복수의 파싱 전략과 try/catch, 그리고 `if (!admin.apps.length) admin.initializeApp(...)` 보호 로직 추가.
- 배포 시 환경변수 값이 JSON 문자열인지(또는 `\\n`이 포함된 문자열인지)를 확인하고, 필요하면 Render 대시보드에서 적절히 이스케이프하여 저장하세요.

검증(테스트) 기록
- 로컬/배포에서 다음 플로우를 확인함:
  1) POST /api/schedules/create → 성공(응답: 생성된 `scheduleId` 반환)
  2) GET /api/schedules?groupId=group1 → 인증된 요청으로 생성된 스케줄 반환(200)
  3) PUT /api/schedules/:id/unavailable → 응답 200, 저장 확인
  4) PATCH /api/schedules/:id/confirm → 응답 200, 확정 메시지
  5) GET /api/schedules/group/{groupId}/today → 확정 결과에 따라 오늘의 근무자 반환

Render 배포 팁
- Render 서비스의 환경변수에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIREBASE_ADMIN_KEY를 등록하세요.
- Render 로그(Deploy → Logs)에서 요청 ID나 에러 스택을 확인하면 빠르게 원인 파악이 가능합니다.

보안 및 운영 권고
- `SUPABASE_SERVICE_ROLE_KEY`는 강력히 비공개로 관리하세요. 클라이언트로 노출되면 안 됩니다.
- `FIREBASE_ADMIN_KEY`는 서비스 계정 키이므로 주기적 롤링(회전)을 고려하세요.
- CI로 자동 배포하는 경우, 환경변수나 시크릿 매니저를 사용하세요.

다음 단계 제안
- 마이그레이션 idempotency 확보: migration 실행 중복을 막는 마이그레이션 테이블/락 추가
- 간단한 통합 테스트(생성→불가제출→확정→조회)를 CI에 추가
- 취약점 알림(깃헙 보안 경고) 대응: 의존성 업데이트

문의 및 참고
- 주요 파일: `server.js`, `services/scheduleService.js`, `utils/supabaseClient.js`, `middlewares/auth.js`, `routes/scheduleRoutes.js`, `controllers/scheduleController.js`, `scripts/create_tables.sql`.
- 추가로 README에 포함하거나 자동화하길 원하시면 알려주세요.

날짜: 2025-11-09
