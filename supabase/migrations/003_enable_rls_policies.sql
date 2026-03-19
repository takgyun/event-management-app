-- ============================================================
-- 마이그레이션 003: RLS 정책 재정의
-- 생성일: 2026-03-19
-- 설명: 001 마이그레이션의 기존 RLS 정책을 P3-6 요구사항에 맞게
--        수정 및 보완 (정책명 컨벤션 통일, 누락 정책 추가)
--
-- 변경 사항:
--   events         - SELECT 조건: status='active' → status!='cancelled'
--                    (completed 이벤트도 열람 가능하도록 확장)
--   event_participants - SELECT: 본인/주최자 → 공개 명단 (모든 사용자)
--                        DELETE: 정책 신규 추가 (본인 또는 주최자)
--   event_notices  - DELETE: author_id만 → author_id AND 주최자 권한 검증
-- ============================================================

-- ============================================================
-- 1. events 테이블 정책 재정의
-- ============================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "events_select_public"         ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated"  ON public.events;
DROP POLICY IF EXISTS "events_update_host"           ON public.events;
DROP POLICY IF EXISTS "events_delete_host"           ON public.events;

-- SELECT: 취소되지 않은 이벤트는 모든 사용자(비인증 포함) 열람 가능
-- cancelled 상태만 숨기고 active/completed 는 공개
CREATE POLICY "enable_select_events"
  ON public.events FOR SELECT
  USING (status != 'cancelled');

-- INSERT: 인증된 사용자만 생성 가능, host_id는 본인 uid와 일치해야 함
CREATE POLICY "enable_insert_events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- UPDATE: 주최자(host_id)만 수정 가능
CREATE POLICY "enable_update_events"
  ON public.events FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- DELETE: 주최자(host_id)만 삭제 가능
CREATE POLICY "enable_delete_events"
  ON public.events FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================================
-- 2. event_participants 테이블 정책 재정의
-- ============================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "event_participants_select"      ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_insert_self" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_update_self" ON public.event_participants;

-- SELECT: 공개 명단 — 모든 사용자(비인증 포함) 열람 가능
CREATE POLICY "enable_select_event_participants"
  ON public.event_participants FOR SELECT
  USING (true);

-- INSERT: 본인 user_id로만 신청 가능
CREATE POLICY "enable_insert_event_participants"
  ON public.event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 본인 또는 해당 이벤트 주최자가 상태 변경 가능
CREATE POLICY "enable_update_event_participants"
  ON public.event_participants FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participants.event_id
        AND host_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participants.event_id
        AND host_id = auth.uid()
    )
  );

-- DELETE: 본인 또는 해당 이벤트 주최자가 참가 레코드 삭제 가능
CREATE POLICY "enable_delete_event_participants"
  ON public.event_participants FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participants.event_id
        AND host_id = auth.uid()
    )
  );

-- ============================================================
-- 3. event_notices 테이블 정책 재정의
-- ============================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "event_notices_select"       ON public.event_notices;
DROP POLICY IF EXISTS "event_notices_insert_host"  ON public.event_notices;
DROP POLICY IF EXISTS "event_notices_update_host"  ON public.event_notices;
DROP POLICY IF EXISTS "event_notices_delete_host"  ON public.event_notices;

-- SELECT: 이벤트 주최자 또는 confirmed 참가자만 공지 열람 가능
CREATE POLICY "enable_select_event_notices"
  ON public.event_notices FOR SELECT
  USING (
    -- 주최자 접근
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id
        AND host_id = auth.uid()
    )
    OR
    -- confirmed 상태 참가자 접근 (waitlist/cancelled 제외)
    EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_id = event_notices.event_id
        AND user_id = auth.uid()
        AND status = 'confirmed'
    )
  );

-- INSERT: 작성자가 본인이고 해당 이벤트의 주최자인 경우만 가능
CREATE POLICY "enable_insert_event_notices"
  ON public.event_notices FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id
        AND host_id = auth.uid()
    )
  );

-- UPDATE: 작성자(주최자)만 수정 가능
CREATE POLICY "enable_update_event_notices"
  ON public.event_notices FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- DELETE: 작성자이면서 해당 이벤트 주최자인 경우만 삭제 가능
CREATE POLICY "enable_delete_event_notices"
  ON public.event_notices FOR DELETE
  USING (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id
        AND host_id = auth.uid()
    )
  );
