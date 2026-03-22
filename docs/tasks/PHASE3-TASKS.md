# Phase 3: 데이터베이스 및 API 개발 - 세부 작업 계획

생성일: 2026-03-19
예상 소요시간: 7-9일 (병렬 처리)
상태: 🔄 계획 수립 완료

---

## 🎯 Phase 3 핵심 목표

- ✅ Supabase 데이터베이스 테이블 생성 (3개 테이블)
- ✅ PostgreSQL 함수로 동시성 안전 참가 신청 (Race Condition 방지)
- ✅ 5개 파일의 Server Actions 구현 (event, participant, notice, auth, helpers)
- ✅ RLS 정책 3개 테이블 완전 설정
- ✅ Mock 데이터 → 실제 API 전환
- ✅ Playwright E2E 테스트 작성 및 검증

---

## 📋 작업 목록 (총 18개 작업)

### 그룹 1: 데이터베이스 마이그레이션 (P3-1, 2-3일)

#### ✅ P3-1.1: DB 마이그레이션 파일 작성 - 테이블 생성

**소요시간**: 1일
**상태**: 대기 중

**작업 내용**:

- `supabase/migrations/001_create_event_tables.sql` 파일 생성
- 3개 테이블 생성 (events, event_participants, event_notices)
- 인덱스 생성 (host_id, status, event_id, user_id, (event_id,status))
- 자동 updated_at 갱신 트리거 구현
- UUID extension 활성화

**검증**:

```bash
mcp__supabase__apply_migration()  # 마이그레이션 적용
mcp__supabase__list_tables()      # 테이블 확인
```

**의존성**: 없음 (P3-1 첫 단계)

---

#### ✅ P3-1.2: DB 마이그레이션 파일 작성 - PostgreSQL 함수

**소요시간**: 1일
**상태**: 대기 중

**작업 내용**:

- `supabase/migrations/002_create_participant_functions.sql` 파일 생성
- `apply_to_event(p_event_id, p_user_id)` 함수:
  - FOR UPDATE로 이벤트 행 잠금
  - 정원 계산 → confirmed/waitlist 판정
  - Race Condition 완벽 방지
- `cancel_participation(p_event_id, p_user_id)` 함수:
  - 참가 취소
  - waitlist 자동 승격
  - order_number 재조정

**핵심**: 동시성 안전성이 최우선

**검증**:

```bash
mcp__supabase__apply_migration()  # 마이그레이션 적용
# Supabase SQL 에디터에서 함수 호출 테스트
SELECT * FROM apply_to_event('event-id', 'user-id');
```

**의존성**: P3-1.1 완료

---

#### ✅ P3-1.3: TypeScript 타입 재생성 및 매핑 레이어

**소요시간**: 1일
**상태**: 대기 중

**작업 내용**:

- `mcp__supabase__generate_typescript_types()` 실행 → `lib/supabase/types.ts` 재생성
- `lib/utils/db-mapper.ts` 신규 파일 생성:
  - `mapDbEventToEvent()` - DB Row → Event 타입
  - `mapDbParticipantToParticipant()` - DB Row → Participant
  - `mapDbNoticeToNotice()` - DB Row → Notice
  - `buildEventWithStats()` - 통계 추가

**중요**: snake_case (DB) → camelCase (TS) 변환

**검증**:

```bash
npm run type-check  # 0 에러
```

**의존성**: P3-1.2 완료

---

### 그룹 2: 인증 및 보호된 라우트 (P3-2, 2-3일, P3-6과 병렬 가능)

#### ✅ P3-2.1: Middleware 추가 - 세션 갱신

**소요시간**: 0.5일
**상태**: 대기 중

**작업 내용**:

- `middleware.ts` 파일 생성 (프로젝트 루트)
- `createServerClient` 초기화
- `supabase.auth.getUser()` 호출로 세션 갱신
- `config.matcher` 설정 (정적 자산 제외)

**검증**:

```bash
npm run dev  # 에러 없음
# 로그인 후 페이지 새로고침 → 세션 유지 확인
```

**의존성**: P3-1.3 완료

---

#### ✅ P3-2.2: 통일된 ActionResult 타입 정의

**소요시간**: 0.5일
**상태**: 대기 중

**작업 내용**:

- `lib/types/action-result.ts` 신규 파일 생성
- ActionResult<T> 타입 정의:
  ```typescript
  type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };
  ```
- `lib/types/index.ts`에서 export

**검증**:

```bash
npm run type-check  # 컴파일 성공
```

**의존성**: P3-2.1 완료

---

#### ✅ P3-2.3: 인증 Server Actions 구현

**소요시간**: 0.5일
**상태**: 대기 중

**작업 내용**:

- `lib/actions/auth.ts` 신규 파일 생성
- `signOut()` - 로그아웃
- `getCurrentUser()` - 현재 사용자 조회
- `getCurrentUserProfile()` - 프로필 조회

**수정 필요**:

- `app/auth/login/login-form.tsx` - 리다이렉트 경로 변경 (/ → /protected/dashboard)

**검증**:

```bash
# signOut() 호출 시 세션 삭제 확인
# getCurrentUser() 호출 시 사용자 정보 반환
```

**의존성**: P3-2.2 완료

---

#### ✅ P3-2.4: 보호된 레이아웃 개선

**소요시간**: 0.5일
**상태**: 대기 중

**작업 내용**:

- `app/protected/layout.tsx` 수정
- Suspense + AuthCheck 컴포넌트 제거
- async 레이아웃으로 변경
- `!user` → `redirect('/auth/login')`

**검증**:

```bash
# 미인증: /protected 접근 → /auth/login 즉시 리다이렉트
# 인증: 대시보드 정상 렌더링
```

**의존성**: P3-2.3 완료

---

### 그룹 3: 이벤트 및 참가 API (P3-3, P3-4, 3-4일, 병렬 가능)

#### ✅ P3-3.1: 권한 검증 헬퍼 함수

**소요시간**: 0.5일
**상태**: 대기 중

**작업 내용**:

- `lib/actions/_helpers.ts` 신규 파일 생성
- `requireAuth(): Promise<string>` - 인증 확인
  - 미인증 → redirect('/auth/login')
- `requireEventHost(eventId): Promise<string>` - 주최자 확인
  - 권한 없음 → throw Error
- `requireConfirmedParticipant(eventId): Promise<string>` - confirmed 참가자 확인

**검증**:

```bash
# 권한 검증 정상 작동 확인
# 미인증/무권한 → 에러 throw
```

**의존성**: P3-2.4 완료

---

#### ✅ P3-3.2: Zod 검증 스키마 확장

**소요시간**: 0.5일
**상태**: 대기 중

**작업 내용**:

- `lib/validations/event.ts` 수정:
  - `updateEventSchema` 추가 (optional 필드들)
- `lib/validations/notice.ts` 신규 파일:
  - `createNoticeSchema` - content 검증

**검증**:

```bash
npm run type-check  # 스키마 타입 안전
```

**의존성**: P3-3.1 완료

---

#### ✅ P3-3.3: 이벤트 CRUD Server Actions 구현

**소요시간**: 1.5일
**상태**: 대기 중

**작업 내용**:

- `lib/actions/event.ts` 신규 파일 생성
- `getEvents(): Promise<EventWithStats[]>` - 전체 조회 (공개)
- `getEventById(id): Promise<ActionResult<EventWithStats>>` - 상세 조회
- `getMyHostedEvents(): Promise<ActionResult<EventWithStats[]>>` - 내 이벤트
- `createEvent(formData): Promise<ActionResult<Event>>` - 생성
  - requireAuth() 호출
  - createEventSchema 검증
  - INSERT → revalidateTag('events')
- `updateEvent(id, formData): Promise<ActionResult<Event>>` - 수정
  - requireEventHost(id) 호출
  - UPDATE → revalidate
- `cancelEvent(id): Promise<ActionResult>` - 취소
  - status='cancelled' UPDATE

**검증**:

```bash
# CRUD 함수 모두 작동
npm run build  # 타입 에러 없음
```

**의존성**: P3-3.2 완료 (P3-4와 병렬 가능)

---

#### ✅ P3-4.1: 참가 관리 Server Actions (PostgreSQL 함수 활용)

**소요시간**: 1.5일
**상태**: 대기 중

**작업 내용**:

- `lib/actions/participant.ts` 신규 파일 생성
- `applyEvent(eventId): Promise<ActionResult>` - 참가 신청
  - requireAuth() 호출
  - `supabase.rpc('apply_to_event', {...})` 호출
  - revalidate
- `cancelParticipation(eventId): Promise<ActionResult>` - 참가 취소
  - requireAuth() 호출
  - rpc('cancel_participation')
  - waitlist 자동 승격은 함수가 처리
- `getEventParticipants(eventId): Promise<ActionResult<Participant[]>>` - 참가자 명단
  - requireEventHost(eventId) 호출
  - event_participants 조회
  - order by status desc, order_number asc
- `getMyParticipatingEvents(): Promise<ActionResult<any[]>>` - 내 참가 이벤트
  - requireAuth() 호출
  - 조인 쿼리
- `getUserParticipationStatus(eventId, userId?): Promise<ActionResult<Participant | null>>` - 참가 상태

**검증**:

```bash
# 참가 신청/취소 DB 저장 확인
# 정원 초과 → waitlist
# 취소 → 자동 승격 확인
```

**의존성**: P3-3.3 (또는 병렬 가능)

---

### 그룹 4: 공지사항 API (P3-5, 1-2일)

#### ✅ P3-5.1: 공지사항 CRUD Server Actions

**소요시간**: 1일
**상태**: 대기 중

**작업 내용**:

- `lib/actions/notice.ts` 신규 파일 생성
- `getEventNotices(eventId): Promise<ActionResult<Notice[]>>` - 조회
  - requireAuth() 호출
  - 권한 확인: 주최자 OR confirmed 참가자만
  - 조회 가능
- `createNotice(eventId, content): Promise<ActionResult<Notice>>` - 작성
  - requireEventHost(eventId) 호출 (주최자만)
  - content 유효성 검증
  - INSERT → revalidate
- `deleteNotice(eventId, noticeId): Promise<ActionResult>` - 삭제
  - requireEventHost(eventId) 호출
  - DELETE → revalidate

**검증**:

```bash
# 권한 검증 정상
# confirmed는 조회 가능, waitlist는 불가
# 주최자만 작성/삭제
```

**의존성**: P3-4.1 완료

---

### 그룹 5: RLS 정책 (P3-6, 2일, P3-2와 병렬 가능)

#### ✅ P3-6.1: RLS 정책 마이그레이션 작성 및 적용

**소요시간**: 1일
**상태**: 대기 중

**작업 내용**:

- `supabase/migrations/003_enable_rls_policies.sql` 생성
- 3개 테이블 RLS 활성화
- **events** 정책:
  - SELECT: status != 'cancelled' (모두)
  - INSERT: host_id = auth.uid()
  - UPDATE/DELETE: host_id = auth.uid()
- **event_participants** 정책:
  - SELECT: true (공개)
  - INSERT/UPDATE/DELETE: user_id = auth.uid() OR 주최자
- **event_notices** 정책:
  - SELECT: host OR confirmed 참가자 (EXISTS)
  - INSERT/DELETE: author_id = auth.uid() AND 주최자

**검증**:

```bash
mcp__supabase__apply_migration()           # 마이그레이션 적용
mcp__supabase__get_advisors('security')   # 보안 검증
```

**의존성**: P3-1.3 완료 (P3-2와 병렬 가능)

---

#### ✅ P3-6.2: RLS 정책 수동 검증 및 테스트

**소요시간**: 1day
**상태**: 대기 중

**작업 내용**:

- Supabase 콘솔에서 테스트 사용자 3명 생성 (비인증, 일반, 주최자)
- 각 역할로 CRUD 권한 테스트
- 권한 없는 접근 → 에러 확인
- 권한 있는 접근 → 성공 확인
- `docs/tasks/rls-test-cases.md` 문서화

**테스트 케이스**:

```
events:
  - 비인증: SELECT ✓ (cancelled 제외)
  - 일반: UPDATE/DELETE ✗
  - 주최자: 자신의 이벤트 UPDATE/DELETE ✓

event_participants:
  - 모두: SELECT ✓
  - 본인: INSERT/UPDATE/DELETE ✓
  - 타인: INSERT/UPDATE/DELETE ✗

event_notices:
  - 비인증: SELECT ✗
  - waitlist: SELECT ✗
  - confirmed: SELECT ✓
  - 주최자: INSERT/DELETE ✓
  - 타인: INSERT/DELETE ✗
```

**검증**:

```bash
# 모든 테스트 케이스 통과
# 권한 에러 로그 없음
```

**의존성**: P3-6.1 완료

---

### 그룹 6: 통합 및 테스트 (P3-7, 4-5일)

#### ✅ P3-7.1: 페이지 컴포넌트 Mock → 실제 API 전환

**소요시간**: 1.5일
**상태**: 대기 중

**작업 내용**:

- Mock 데이터 제거 → Server Actions 호출로 변경
- 영향받는 페이지:
  - `app/events/page.tsx` → getEvents() 호출
  - `app/events/[id]/page.tsx` → getEventById() 호출
  - `app/protected/dashboard/page.tsx` → getMyHostedEvents(), getMyParticipatingEvents()
  - `app/protected/events/create/page.tsx` → createEvent()
  - `app/protected/events/[id]/edit/page.tsx` → updateEvent()
  - `app/protected/events/[id]/manage/page.tsx` → getEventParticipants(), getEventNotices()

- 각 페이지:
  - Mock 데이터 import 제거
  - Server Actions import 추가
  - await 호출
  - success 확인 후 렌더링
  - 에러 상태 표시

**검증**:

```bash
npm run dev  # 개발 서버 시작
# 각 페이지 접근하여 데이터 표시 확인
npm run build  # 타입 에러 없음
```

**의존성**: P3-6.2 완료

---

#### ✅ P3-7.2: Playwright E2E 테스트 작성 - 핵심 플로우

**소요시간**: 2일
**상태**: 대기 중

**작업 내용**:

- `tests/e2e/event-flow.spec.ts` - 통합 플로우
  1. 호스트 회원가입
  2. 로그인
  3. 이벤트 생성
  4. 다른 사용자 로그인
  5. 이벤트 목록/상세 접근
  6. 참가 신청
  7. 호스트로 로그인
  8. 공지사항 작성
  9. 참가자로 공지사항 조회

- `tests/e2e/waitlist.spec.ts` - 정원 초과 시나리오
  1. 정원 2명 이벤트 생성
  2. 사용자 A, B, C 순서로 신청
  3. A, B는 confirmed, C는 waitlist
  4. A 취소 → C 자동 승격 확인

- `tests/e2e/authorization.spec.ts` - 권한 검증
  1. 비로그인 /protected 접근 → 로그인 리다이렉트
  2. 비주최자 수정 시도 → 에러
  3. waitlist 공지사항 조회 → 불가

**검증**:

```bash
npx playwright test tests/e2e/  # 모든 테스트 통과
```

**의존성**: P3-7.1 완료

---

#### ✅ P3-7.3: 최종 보안 감사 및 검증

**소요시간**: 1day
**상태**: 대기 중

**작업 내용**:

- 보안 검증:
  ```bash
  mcp__supabase__get_advisors({ type: 'security' })
  ```
- 타입 검증:
  ```bash
  npm run type-check  # 0 에러
  ```
- 코드 품질:
  ```bash
  npm run lint  # 0 경고
  ```
- 성능 검증:
  - 데이터베이스 쿼리 성능
  - N+1 쿼리 문제 없음
  - 인덱스 활용 확인
- 문서화:
  - `docs/tasks/phase3-implementation-summary.md` 작성
  - 구현된 기능 목록
  - 마이그레이션 적용 순서
  - 테스트 결과
- 배포 준비:
  - 환경 변수 확인
  - 마이그레이션 문서
  - 롤백 계획

**검증**:

```bash
npm run type-check  # 0 에러
npm run lint        # 0 경고
# mcp__supabase__get_advisors 보안 경고 없음
# 모든 E2E 테스트 통과
```

**의존성**: P3-7.2 완료

---

## 📊 병렬 처리 전략

```
P3-1 (DB 마이그레이션) ← 선행 필수 (3일)
  ↓
├─ P3-2 (인증) [병렬 가능] ← 2-3일
├─ P3-6 (RLS) [병렬 가능] ← 2일
  ↓
├─ P3-3 (이벤트) [병렬 가능] ← 1.5일
├─ P3-4 (참가) [병렬 가능] ← 1.5일
  ↓
├─ P3-5 (공지) ← 1일
  ↓
└─ P3-7 (테스트) ← 4-5일

총 소요시간: 7-9일 (병렬 처리)
```

---

## 🔄 진행 상황 추적

### 마일스톤

- [ ] **M1**: P3-1 완료 (DB 마이그레이션) - 3일
- [ ] **M2**: P3-2, P3-6 완료 (인증, RLS) - 5일
- [ ] **M3**: P3-3, P3-4 완료 (이벤트, 참가) - 6.5일
- [ ] **M4**: P3-5 완료 (공지) - 7.5일
- [ ] **M5**: P3-7 완료 (테스트 및 검증) - 9일

---

## ✅ Phase 3 완료 조건

- ✅ 모든 18개 작업 완료
- ✅ npm run type-check 0 에러
- ✅ npm run lint 0 경고
- ✅ mcp**supabase**get_advisors('security') 보안 경고 없음
- ✅ Playwright E2E 테스트 모두 통과
- ✅ Mock 데이터 모두 실제 API로 전환
- ✅ 배포 준비 완료

---

## 📝 다음 단계

**Phase 3 시작**: P3-1.1부터 순차적으로 진행
**Phase 4 준비**: Phase 3 완료 후 성능 최적화, 부가 기능, 프로덕션 배포
