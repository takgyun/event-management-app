# Phase 3: 데이터베이스 및 API 개발 상세 분석 및 실행 계획

작성일: 2026-03-19
분석 대상: ROADMAP.md Phase 3 (P3-1 ~ P3-7)

---

## 📊 Executive Summary

### 현재 상태

이 프로젝트는 **Supabase 기반 인프라가 이미 70% 구축**되어 있습니다:

- ✅ Supabase Auth 설정 완료 (로그인/회원가입 실제 동작)
- ✅ `@supabase/ssr` 패키지 통합 (서버/클라이언트 분리)
- ✅ Server Actions 패턴 정립 (`lib/actions/profile.ts` 참고)
- ✅ TypeScript 엄격 모드 + Zod 검증 스키마 완성
- ❌ **데이터베이스 테이블 미존재** — 모두 Mock 데이터 기반
- ❌ 이벤트/참가자/공지사항 관련 Server Actions 없음
- ❌ RLS 정책 미설정

### Phase 3의 핵심 업무

1. **마이그레이션**: 2개의 SQL 파일로 이벤트 테이블 생성
2. **API 구현**: `lib/actions/` 하에 5개 파일 추가 (event, participant, notice, auth, helpers)
3. **PostgreSQL 함수**: 선착순 참가 신청 Race Condition 방지 (2개 함수)
4. **페이지 통합**: Mock 데이터 제거 후 실제 API 호출로 전환
5. **테스트**: Playwright E2E 테스트 작성 및 검증

### 추정 소요 시간

| 단계       | 작업                          | 예상 시간   |
| ---------- | ----------------------------- | ----------- |
| P3-1       | DB 마이그레이션 + 타입 생성   | 2-3일       |
| P3-2, P3-6 | 인증 + RLS (병렬 가능)        | 2-3일       |
| P3-3, P3-4 | 이벤트 + 참가 API (병렬 가능) | 3-4일       |
| P3-5       | 공지사항 API                  | 1-2일       |
| P3-7       | 통합 테스트                   | 2-3일       |
| **합계**   |                               | **10-15일** |

**절약 전략**: P3-2와 P3-6을 병렬 처리, P3-3과 P3-4를 병렬 처리하면 **8-10일**로 단축 가능.

---

## 🔍 현재 프로젝트 상태 분석

### 1.1 Supabase 설정 현황

#### 완성된 항목

```
lib/supabase/
├── client.ts        ✅ 브라우저용 클라이언트 (createBrowserClient)
├── server.ts        ✅ 서버용 클라이언트 (await cookies() 패턴)
├── proxy.ts         ✅ API 라우트용 프록시
└── types.ts         ⚠️ 현재 profiles 테이블만 정의

app/auth/
├── login/           ✅ 실제 Supabase Auth 호출
├── signup/          ✅ 실제 Supabase Auth 호출
├── callback/        ✅ OAuth 코드 교환 처리
└── reset-password/  ✅ 비밀번호 재설정 페이지

app/protected/       ✅ 인증 게이트 동작
```

#### 미완성 항목

```
[ ] 데이터베이스 테이블
    - events
    - event_participants
    - event_notices

[ ] PostgreSQL 함수
    - apply_to_event() — 선착순 신청 처리
    - cancel_participation() — 취소 + 대기자 자동 승격

[ ] 미들웨어
    - middleware.ts — 세션 갱신 미들웨어

[ ] Server Actions
    - lib/actions/event.ts
    - lib/actions/participant.ts
    - lib/actions/notice.ts
```

### 1.2 인증 시스템 현황

**강점:**

- Supabase Auth 이미 동작 중 (로그인/회원가입 UI → 실제 DB 저장)
- Zod 검증 스키마 완성
- `@supabase/ssr` 최신 패턴 적용

**수정 필요 사항:**

- `login-form.tsx`에서 로그인 성공 후 `/`로 리다이렉트 → `/protected/dashboard`로 변경
- `protected/layout.tsx`의 `Suspense` 문제 — async layout으로 전환 (즉시 리다이렉트 보장)
- `lib/actions/auth.ts` 없음 — Server Action 방식으로 추가

### 1.3 타입 시스템 현황

**강점:**

```
lib/types/index.ts       ✅ 도메인 타입 완성 (Event, Participant, Notice, EventWithStats)
lib/validations/event.ts ✅ Zod 스키마 완성
lib/validations/auth.ts  ✅ Zod 스키마 완성
```

**갭:**

```
[ ] lib/supabase/types.ts — DB 테이블 생성 후 재생성 필요
[ ] lib/utils/db-mapper.ts — DB snake_case → 도메인 camelCase 변환 레이어
[ ] lib/validations/notice.ts — 공지사항 Zod 스키마
[ ] lib/validations/participant.ts — 참가 Zod 스키마 (최소화)
```

### 1.4 Server Actions 패턴

**기존 패턴 (`lib/actions/profile.ts`):**

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 검증 및 처리...
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: ... })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/protected/profile');
  return { success: true };
}
```

**적용해야 할 패턴:**

- 모든 Server Actions는 동일한 구조 따르기
- `requireAuth()`, `requireEventHost()` 헬퍼로 인증/권한 검증
- Zod safeParse로 입력값 검증
- 통일된 반환 타입: `{ success: true; data: T } | { success: false; error: string }`

---

## 🛠️ Phase 3 최적화된 실행 전략

### 2.1 수정된 의존성 다이어그램

```
P3-1: DB 마이그레이션 (선행 필수)
  │
  ├─────────────────────────────────────┐
  │                                     │
P3-2: 인증 Server Actions      P3-6: RLS 정책 완성
  │                                     │
  ├─────────────────────────────────────┤
  │ (병렬 처리 가능)                    │
  │                                     │
P3-3: 이벤트 CRUD API         (동시 완료 필수)
  ├─ PostgreSQL 함수 (apply_to_event, cancel_participation)
  │
P3-4: 참가 관리 API (P3-3과 병렬 가능)
  │
P3-5: 공지사항 API
  │
P3-7: 통합 테스트
```

### 2.2 권장 진행 순서

| 순번 | 작업                      | 소요 시간 | 병렬        | 비고                      |
| ---- | ------------------------- | --------- | ----------- | ------------------------- |
| 1    | P3-1: DB 마이그레이션     | 2-3일     | 단독        | 모든 API의 기반           |
| 2    | P3-2: 인증 Server Actions | 1-2일     | P3-6과 병렬 | 기존 구조 활용            |
| 2    | P3-6: RLS 정책 완성       | 1-2일     | P3-2와 병렬 | 테이블만 존재하면 가능    |
| 3    | P3-3: 이벤트 API + 함수   | 2-3일     | P3-4와 병렬 | PostgreSQL 함수 포함      |
| 3    | P3-4: 참가 관리 API       | 2-3일     | P3-3과 병렬 | events 테이블 조회만 필요 |
| 4    | P3-5: 공지사항 API        | 1-2일     | 단독        | 권한 검증 필요            |
| 5    | P3-7: 통합 테스트         | 2-3일     | 단독        | 전체 완료 후              |

**병렬 처리로 총 소요 시간: 8-10일**

---

## 📋 각 단계별 구현 상세 가이드

### 3.1 P3-1: 데이터베이스 마이그레이션

#### 3.1.1 마이그레이션 파일 생성

**파일 1: `supabase/migrations/001_create_event_tables.sql`**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event participants table (중복 신청 방지 및 선착순 관리)
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
  order_number INTEGER NOT NULL, -- 신청 순서 (confirmed/waitlist 별로 관리)
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- 사용자당 1건의 참가만 허용
);

-- Event notices table
CREATE TABLE IF NOT EXISTS public.event_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 성능 인덱스 생성
CREATE INDEX idx_events_host_id ON public.events(host_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX idx_event_participants_status ON public.event_participants(event_id, status);
CREATE INDEX idx_event_notices_event_id ON public.event_notices(event_id);

-- 자동 updated_at 갱신 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 생성
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at
  BEFORE UPDATE ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_notices_updated_at
  BEFORE UPDATE ON public.event_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**파일 2: `supabase/migrations/002_create_participant_functions.sql`**

```sql
-- 선착순 참가 신청 함수 (Race Condition 방지)
CREATE OR REPLACE FUNCTION public.apply_to_event(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(status TEXT, order_number INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_capacity INT;
  v_confirmed_count INT;
  v_next_order INT;
  v_participant_status TEXT;
BEGIN
  -- 트랜잭션 잠금으로 동시 신청 방지 (FOR UPDATE)
  SELECT max_capacity INTO v_max_capacity
  FROM public.events
  WHERE id = p_event_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '이벤트를 찾을 수 없거나 참가 신청이 불가능한 상태입니다.';
  END IF;

  -- 중복 신청 확인
  IF EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_id = p_event_id AND user_id = p_user_id AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION '이미 신청한 이벤트입니다.';
  END IF;

  -- 현재 confirmed 인원 수 계산
  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.event_participants
  WHERE event_id = p_event_id AND status = 'confirmed';

  -- confirmed vs waitlist 결정
  IF v_confirmed_count < v_max_capacity THEN
    v_participant_status := 'confirmed';
    v_next_order := v_confirmed_count + 1;
  ELSE
    v_participant_status := 'waitlist';
    SELECT COALESCE(MAX(order_number), 0) + 1 INTO v_next_order
    FROM public.event_participants
    WHERE event_id = p_event_id AND status = 'waitlist';
  END IF;

  -- 참가 기록 삽입 (중복 시 업데이트)
  INSERT INTO public.event_participants (event_id, user_id, status, order_number)
  VALUES (p_event_id, p_user_id, v_participant_status, v_next_order)
  ON CONFLICT (event_id, user_id) DO UPDATE
    SET status = v_participant_status,
        order_number = v_next_order,
        applied_at = NOW(),
        updated_at = NOW();

  RETURN QUERY SELECT v_participant_status::TEXT, v_next_order;
END;
$$;

-- 참가 취소 함수 (대기자 자동 승격)
CREATE OR REPLACE FUNCTION public.cancel_participation(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_status TEXT;
  v_participant_order INT;
  v_next_waitlist_id UUID;
BEGIN
  -- 현재 참가 상태 조회 및 행 잠금
  SELECT status, order_number INTO v_participant_status, v_participant_order
  FROM public.event_participants
  WHERE event_id = p_event_id AND user_id = p_user_id AND status != 'cancelled'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '참가 신청 내역을 찾을 수 없습니다.';
  END IF;

  -- 참가 취소
  UPDATE public.event_participants
  SET status = 'cancelled', updated_at = NOW()
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- confirmed 취소인 경우 대기자 자동 승격
  IF v_participant_status = 'confirmed' THEN
    -- 빈 자리 채우기: confirmed order_number 재조정
    UPDATE public.event_participants
    SET order_number = order_number - 1
    WHERE event_id = p_event_id
      AND status = 'confirmed'
      AND order_number > v_participant_order;

    -- waitlist 첫 번째를 confirmed로 승격
    SELECT id INTO v_next_waitlist_id
    FROM public.event_participants
    WHERE event_id = p_event_id AND status = 'waitlist'
    ORDER BY order_number ASC
    LIMIT 1;

    IF v_next_waitlist_id IS NOT NULL THEN
      UPDATE public.event_participants
      SET status = 'confirmed',
          order_number = (
            SELECT COUNT(*) FROM public.event_participants
            WHERE event_id = p_event_id AND status = 'confirmed'
          ) + 1,
          updated_at = NOW()
      WHERE id = v_next_waitlist_id;

      -- 나머지 waitlist order 재조정
      UPDATE public.event_participants
      SET order_number = order_number - 1
      WHERE event_id = p_event_id
        AND status = 'waitlist'
        AND order_number > 1;
    END IF;
  END IF;
END;
$$;
```

#### 3.1.2 마이그레이션 적용 단계

```bash
# 1. Supabase 마이그레이션 적용
npx supabase migration list  # 현재 상태 확인

# 2. 실제 적용 (Cloud Console 또는 MCP 도구 사용)
# MCP: mcp__supabase__apply_migration(name, query)로 각 파일 내용 실행

# 3. 타입 재생성
npx supabase gen types typescript > lib/supabase/types.ts

# 4. 보안 검증
# MCP: mcp__supabase__get_advisors({ type: 'security' })
```

#### 3.1.3 신규 파일 생성: DB 매퍼 유틸

**`lib/utils/db-mapper.ts`** — DB Row → 도메인 타입 변환

```typescript
// lib/utils/db-mapper.ts
import type { Tables } from '@/lib/supabase/types';
import type { Event, EventWithStats, Participant, Notice } from '@/lib/types';

/**
 * DB의 snake_case를 도메인의 camelCase로 변환
 */

export function mapDbEventToEvent(row: Tables<'events'>): Event {
  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    description: row.description,
    eventDate: new Date(row.event_date),
    location: row.location,
    maxCapacity: row.max_capacity,
    status: row.status as Event['status'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapDbParticipantToParticipant(row: Tables<'event_participants'>): Participant {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status as Participant['status'],
    orderNumber: row.order_number,
    appliedAt: new Date(row.applied_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapDbNoticeToNotice(row: Tables<'event_notices'>): Notice {
  return {
    id: row.id,
    eventId: row.event_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// EventWithStats를 위한 헬퍼 (aggregation 필요)
export function buildEventWithStats(
  event: Event,
  stats: { confirmedCount: number; waitlistCount: number }
): EventWithStats {
  return {
    ...event,
    confirmedCount: stats.confirmedCount,
    waitlistCount: stats.waitlistCount,
  };
}
```

### 3.2 P3-2: 인증 시스템 구현

#### 3.2.1 미들웨어 추가 (세션 갱신)

**`middleware.ts`** — 프로젝트 루트

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 세션 갱신 (중요: 이 호출이 쿠키 업데이트 트리거)
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // 모든 경로 매칭 (정적 자산 제외)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 3.2.2 Server Action 추가

**`lib/actions/auth.ts`** — 인증 관련 Server Actions

```typescript
// lib/actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * 로그아웃 Server Action
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * 현재 인증된 사용자 조회
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 현재 사용자의 프로필 정보 조회
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return profile;
}
```

#### 3.2.3 보호된 레이아웃 개선

**`app/protected/layout.tsx`** 수정

```typescript
// app/protected/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header, Navigation 등 */}
      <main className="flex-1 w-full">{children}</main>
      {/* Footer */}
    </div>
  );
}
```

#### 3.2.4 로그인 페이지 리다이렉트 수정

**`app/auth/login/login-form.tsx`** 수정 부분

```typescript
// 변경 전:
// router.push('/');

// 변경 후:
// router.push('/protected/dashboard');
```

### 3.3 P3-6: RLS 정책 설정

#### 3.3.1 RLS 정책 마이그레이션

**`supabase/migrations/003_enable_rls_policies.sql`**

```sql
-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- events table RLS
-- ============================================

-- 모든 사용자가 active/completed 이벤트 조회 가능
CREATE POLICY "enable_select_active_events" ON public.events
  FOR SELECT
  USING (status != 'cancelled');

-- 주최자만 자신의 이벤트 수정 가능
CREATE POLICY "enable_update_own_events" ON public.events
  FOR UPDATE
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 주최자만 자신의 이벤트 삭제 가능
CREATE POLICY "enable_delete_own_events" ON public.events
  FOR DELETE
  USING (host_id = auth.uid());

-- 인증된 사용자만 이벤트 생성 가능
CREATE POLICY "enable_insert_events" ON public.events
  FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- ============================================
-- event_participants table RLS
-- ============================================

-- 모든 사용자가 참가자 명단 조회 가능
CREATE POLICY "enable_select_participants" ON public.event_participants
  FOR SELECT
  USING (true);

-- 본인만 참가 신청 가능
CREATE POLICY "enable_insert_own_participation" ON public.event_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 본인만 참가 취소 가능
CREATE POLICY "enable_update_own_participation" ON public.event_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 본인만 참가 취소 가능 (또는 주최자가 관리용)
CREATE POLICY "enable_delete_own_participation" ON public.event_participants
  FOR DELETE
  USING (user_id = auth.uid() OR
         auth.uid() IN (SELECT host_id FROM public.events WHERE id = event_id));

-- ============================================
-- event_notices table RLS
-- ============================================

-- 주최자와 confirmed 참가자만 공지사항 조회
CREATE POLICY "enable_select_notices_for_host_and_confirmed" ON public.event_notices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id AND host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_id = event_notices.event_id
        AND user_id = auth.uid()
        AND status = 'confirmed'
    )
  );

-- 주최자만 공지사항 작성
CREATE POLICY "enable_insert_notices" ON public.event_notices
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id AND host_id = auth.uid()
    )
  );

-- 주최자만 공지사항 삭제
CREATE POLICY "enable_delete_notices" ON public.event_notices
  FOR DELETE
  USING (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id AND host_id = auth.uid()
    )
  );
```

**⚠️ 주의**: RLS 활성화 후 테스트 반드시 수행. 정책 오류로 모든 쿼리 차단될 수 있음.

### 3.4 P3-3: 이벤트 관리 API

#### 3.4.1 권한 검증 헬퍼

**`lib/actions/_helpers.ts`** — 공통 헬퍼 함수

```typescript
// lib/actions/_helpers.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * 인증된 사용자 ID 반환 (미인증 시 리다이렉트)
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  return user.id;
}

/**
 * 이벤트 주최자 확인
 */
export async function requireEventHost(eventId: string): Promise<string> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single();

  if (error || !event || event.host_id !== userId) {
    throw new Error('이벤트 주최자만 가능한 작업입니다.');
  }

  return userId;
}

/**
 * confirmed 참가자 확인
 */
export async function requireConfirmedParticipant(eventId: string): Promise<string> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data: participant, error } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .single();

  if (error || !participant) {
    throw new Error('이벤트의 confirmed 참가자만 가능한 작업입니다.');
  }

  return userId;
}
```

#### 3.4.2 이벤트 Server Actions

**`lib/actions/event.ts`** — 이벤트 CRUD

```typescript
// lib/actions/event.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createEventSchema, updateEventSchema } from '@/lib/validations/event';
import { requireAuth, requireEventHost } from './_helpers';
import { mapDbEventToEvent, buildEventWithStats } from '@/lib/utils/db-mapper';
import type { Event, EventWithStats } from '@/lib/types';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * 전체 이벤트 목록 조회 (공개)
 */
export async function getEvents(): Promise<EventWithStats[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      confirmed_count:event_participants(count).filter(status.eq.confirmed),
      waitlist_count:event_participants(count).filter(status.eq.waitlist)
    `
    )
    .neq('status', 'cancelled')
    .order('event_date', { ascending: true });

  if (error) {
    console.error('[getEvents]', error);
    return [];
  }

  return data.map((row) => {
    const event = mapDbEventToEvent(row as any);
    return buildEventWithStats(event, {
      confirmedCount: row.confirmed_count[0]?.count || 0,
      waitlistCount: row.waitlist_count[0]?.count || 0,
    });
  });
}

/**
 * 이벤트 상세 조회
 */
export async function getEventById(id: string): Promise<ActionResult<EventWithStats>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      confirmed_count:event_participants(count).filter(status.eq.confirmed),
      waitlist_count:event_participants(count).filter(status.eq.waitlist)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return { success: false, error: '이벤트를 찾을 수 없습니다.' };
  }

  const event = mapDbEventToEvent(data as any);
  return {
    success: true,
    data: buildEventWithStats(event, {
      confirmedCount: data.confirmed_count[0]?.count || 0,
      waitlistCount: data.waitlist_count[0]?.count || 0,
    }),
  };
}

/**
 * 사용자의 주최 이벤트 조회
 */
export async function getMyHostedEvents(): Promise<ActionResult<EventWithStats[]>> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      confirmed_count:event_participants(count).filter(status.eq.confirmed),
      waitlist_count:event_participants(count).filter(status.eq.waitlist)
    `
    )
    .eq('host_id', userId)
    .neq('status', 'cancelled')
    .order('event_date', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const events = data.map((row) => {
    const event = mapDbEventToEvent(row as any);
    return buildEventWithStats(event, {
      confirmedCount: row.confirmed_count[0]?.count || 0,
      waitlistCount: row.waitlist_count[0]?.count || 0,
    });
  });

  return { success: true, data: events };
}

/**
 * 이벤트 생성
 */
export async function createEvent(formData: FormData): Promise<ActionResult<Event>> {
  const userId = await requireAuth();

  // Zod 검증
  const parsed = createEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    eventDate: formData.get('eventDate'),
    location: formData.get('location'),
    maxCapacity: Number(formData.get('maxCapacity')),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: '입력값을 확인해주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .insert({
      host_id: userId,
      title: parsed.data.title,
      description: parsed.data.description,
      event_date: parsed.data.eventDate,
      location: parsed.data.location,
      max_capacity: parsed.data.maxCapacity,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTag('events');
  const event = mapDbEventToEvent(data);
  return { success: true, data: event };
}

/**
 * 이벤트 수정
 */
export async function updateEvent(id: string, formData: FormData): Promise<ActionResult<Event>> {
  await requireEventHost(id);

  const parsed = updateEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: '입력값을 확인해주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTag('events');
  revalidatePath(`/protected/events/${id}`);
  const event = mapDbEventToEvent(data);
  return { success: true, data: event };
}

/**
 * 이벤트 취소
 */
export async function cancelEvent(id: string): Promise<ActionResult> {
  await requireEventHost(id);

  const supabase = await createClient();

  const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTag('events');
  revalidatePath(`/protected/events/${id}`);
  return { success: true };
}
```

### 3.5 P3-4: 참가 관리 API

**`lib/actions/participant.ts`** — 참가 관리

```typescript
// lib/actions/participant.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAuth, requireEventHost } from './_helpers';
import { mapDbParticipantToParticipant } from '@/lib/utils/db-mapper';
import type { Participant } from '@/lib/types';
import type { ActionResult } from './event';

/**
 * 이벤트에 참가 신청
 */
export async function applyEvent(eventId: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('apply_to_event', {
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/protected/dashboard');
  return { success: true };
}

/**
 * 이벤트 참가 취소
 */
export async function cancelParticipation(eventId: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.rpc('cancel_participation', {
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/protected/dashboard');
  return { success: true };
}

/**
 * 이벤트 참가자 명단 (주최자용)
 */
export async function getEventParticipants(eventId: string): Promise<ActionResult<Participant[]>> {
  await requireEventHost(eventId);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .order('status', { ascending: false })
    .order('order_number', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const participants = data.map(mapDbParticipantToParticipant);
  return { success: true, data: participants };
}

/**
 * 사용자의 참가 중인 이벤트
 */
export async function getMyParticipatingEvents(): Promise<ActionResult<any[]>> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_participants')
    .select(
      `
      *,
      events:event_id (*)
    `
    )
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .order('applied_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * 특정 이벤트의 사용자 참가 상태 조회
 */
export async function getUserParticipationStatus(
  eventId: string,
  userId?: string
): Promise<ActionResult<Participant | null>> {
  const authUserId = userId || (await requireAuth());
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', authUserId)
    .neq('status', 'cancelled')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = 결과 없음 (정상)
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: true, data: null };
  }

  return { success: true, data: mapDbParticipantToParticipant(data) };
}
```

### 3.6 P3-5: 공지사항 API

**`lib/actions/notice.ts`** — 공지사항 CRUD

```typescript
// lib/actions/notice.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireEventHost, requireConfirmedParticipant } from './_helpers';
import { mapDbNoticeToNotice } from '@/lib/utils/db-mapper';
import type { Notice } from '@/lib/types';
import type { ActionResult } from './event';

/**
 * 공지사항 조회 (주최자와 confirmed 참가자만)
 */
export async function getEventNotices(eventId: string): Promise<ActionResult<Notice[]>> {
  const userId = await requireAuth();
  const supabase = await createClient();

  // 권한 확인: 주최자 또는 confirmed 참가자
  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single();

  const isHost = event?.host_id === userId;

  if (!isHost) {
    const { data: participant } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .single();

    if (!participant) {
      return { success: false, error: '공지사항을 조회할 권한이 없습니다.' };
    }
  }

  const { data, error } = await supabase
    .from('event_notices')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const notices = data.map(mapDbNoticeToNotice);
  return { success: true, data: notices };
}

/**
 * 공지사항 작성 (주최자만)
 */
export async function createNotice(
  eventId: string,
  content: string
): Promise<ActionResult<Notice>> {
  const userId = await requireEventHost(eventId);
  const supabase = await createClient();

  if (!content.trim()) {
    return { success: false, error: '공지사항 내용을 입력해주세요.' };
  }

  const { data, error } = await supabase
    .from('event_notices')
    .insert({
      event_id: eventId,
      author_id: userId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/protected/events/${eventId}/manage`);
  const notice = mapDbNoticeToNotice(data);
  return { success: true, data: notice };
}

/**
 * 공지사항 삭제 (주최자만)
 */
export async function deleteNotice(eventId: string, noticeId: string): Promise<ActionResult> {
  await requireEventHost(eventId);

  const supabase = await createClient();

  const { error } = await supabase
    .from('event_notices')
    .delete()
    .eq('id', noticeId)
    .eq('event_id', eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/protected/events/${eventId}/manage`);
  return { success: true };
}
```

---

## 📱 페이지 통합: Mock → 실제 API

### 4.1 통합 단계

각 페이지 컴포넌트에서 `lib/data/mock-data.ts`의 Mock 데이터를 실제 Server Actions 호출로 전환합니다.

**예시: 이벤트 목록 페이지**

```typescript
// app/events/page.tsx (변경 전: Mock 데이터)
import { mockEvents } from '@/lib/data/mock-data';

export default async function EventsPage() {
  const events = mockEvents;
  // ...
}

// app/events/page.tsx (변경 후: 실제 API)
import { getEvents } from '@/lib/actions/event';

export default async function EventsPage() {
  const events = await getEvents();
  // ...
}
```

### 4.2 통합 체크리스트

- [ ] `app/events/page.tsx` — `getEvents()` 연동
- [ ] `app/events/[id]/page.tsx` — `getEventById()`, `getUserParticipationStatus()` 연동
- [ ] `app/protected/dashboard/page.tsx` — `getMyHostedEvents()`, `getMyParticipatingEvents()` 연동
- [ ] `app/protected/events/[id]/manage/page.tsx` — `getEventParticipants()`, `getEventNotices()` 연동
- [ ] 모든 Form 컴포넌트 — Server Actions로 전환

---

## 🧪 P3-7: 통합 테스트

### 5.1 테스트 시나리오

Playwright 기반 E2E 테스트를 작성합니다.

```typescript
// tests/e2e/event-flow.spec.ts

import { test, expect } from '@playwright/test';

test('회원가입 → 이벤트 생성 → 참가 신청 → 공지사항 확인 플로우', async ({ page }) => {
  // 1. 홈페이지 접속
  await page.goto('/');

  // 2. 회원가입 (사용자 A: 주최자)
  await page.click('text=회원가입');
  await page.fill('input[name=email]', 'host@example.com');
  await page.fill('input[name=password]', 'password123!');
  await page.fill('input[name=confirmPassword]', 'password123!');
  await page.click('button:has-text("가입하기")');
  await page.waitForURL('/protected/dashboard');

  // 3. 이벤트 생성
  await page.click('text=새 이벤트 만들기');
  await page.fill('input[name=title]', '봄 독서 모임');
  await page.fill('textarea[name=description]', '함께 책을 읽고 이야기하는 모임입니다.');
  await page.fill('input[name=eventDate]', '2026-04-15T19:00');
  await page.fill('input[name=location]', '강남 카페');
  await page.fill('input[name=maxCapacity]', '10');
  await page.click('button:has-text("생성하기")');

  // 4. 이벤트 ID 확인
  const eventUrl = page.url();
  const eventId = eventUrl.split('/').pop();

  // 5. 로그아웃 후 참가자로 로그인 (사용자 B)
  // ... (로그아웃 및 다른 사용자로 로그인)

  // 6. 이벤트 목록에서 해당 이벤트 찾기
  // ...

  // 7. 참가 신청
  // ...

  // 8. 주최자로 다시 로그인 후 공지사항 작성
  // ...
});

test('정원 초과 시 waitlist 처리 확인', async ({ page }) => {
  // 정원 2명인 이벤트 생성
  // 사용자 A, B, C 순서로 신청
  // A, B는 confirmed, C는 waitlist 확인
  // A 취소 후 C가 자동 승격 확인
});
```

### 5.2 테스트 실행 환경

```bash
# 테스트 데이터 초기화
# supabase/seed.sql 실행

# E2E 테스트 실행
npx playwright test tests/e2e/

# UI 모드로 디버깅
npx playwright test --ui
```

---

## ⚠️ 리스크 및 완화 전략

### 1. 동시성 문제 (선착순 참가)

**리스크**: 다수 사용자가 동시에 정원 마지막 자리에 신청할 때 Race Condition 발생

**완화책**: PostgreSQL의 `FOR UPDATE` 트랜잭션으로 이벤트 행을 잠금. `apply_to_event` 함수 참고.

### 2. RLS 설정 오류

**리스크**: RLS 정책 오류로 데이터 노출 또는 모든 쿼리 차단

**완화책**:

- 마이그레이션 적용 후 즉시 `mcp__supabase__get_advisors({ type: 'security' })` 실행
- 각 테이블의 3가지 역할(비인증, 일반, 주최자)로 수동 권한 테스트
- RLS 활성화는 정책 생성 후 마지막에 적용

### 3. 마이그레이션 오류

**리스크**: 마이그레이션 적용 실패 후 DB 상태 불일치

**완화책**:

- Supabase 개발 브랜치에서 먼저 테스트 (`mcp__supabase__create_branch`)
- 각 마이그레이션 파일에 롤백 스크립트 포함
- `mcp__supabase__list_migrations()` 로 항상 상태 확인

### 4. 타입 동기화 오류

**리스크**: DB 스키마 변경 후 TypeScript 타입 미갱신으로 타입 안전성 상실

**완화책**:

- 마이그레이션 직후 즉시 `mcp__supabase__generate_typescript_types()` 실행
- `lib/utils/db-mapper.ts`에서 매핑 레이어 통해 타입 변환

---

## 📅 구현 시작 체크리스트

Phase 3 시작 전 확인 사항:

```
[ ] Supabase 프로젝트 URL/KEY .env.local 설정 확인
[ ] mcp__supabase__list_tables() 실행하여 현재 DB 상태 확인
[ ] P3-1 마이그레이션 2개 파일 작성
[ ] mcp__supabase__apply_migration() 으로 마이그레이션 적용
[ ] mcp__supabase__generate_typescript_types() 실행
[ ] lib/utils/db-mapper.ts 생성
[ ] apply_to_event, cancel_participation PostgreSQL 함수 생성
[ ] middleware.ts 생성
[ ] lib/actions/ 하에 5개 파일 생성 (auth, event, participant, notice, _helpers)
[ ] P3-6 RLS 정책 마이그레이션 생성 및 적용
[ ] 각 페이지 컴포넌트에서 Mock 데이터 → 실제 API 연동
[ ] mcp__supabase__get_advisors({ type: 'security' }) 실행
[ ] Playwright E2E 테스트 작성 및 실행
```

---

## 🎯 다음 단계

1. **P3-1 마이그레이션 작성 및 적용** ← 먼저 시작
2. **P3-2, P3-6 병렬 진행** — 인증 + RLS
3. **P3-3, P3-4 병렬 진행** — 이벤트 + 참가 API
4. **P3-5** — 공지사항 API
5. **P3-7** — 통합 테스트

이 문서는 Phase 3 진행 중 참고하는 실행 가이드입니다. 질문이 있으면 언제든지 물어보세요.
