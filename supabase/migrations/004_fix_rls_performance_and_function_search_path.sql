-- ============================================================
-- 마이그레이션 004: RLS 성능 최적화 및 함수 보안 수정
-- 생성일: 2026-03-20
-- 설명:
--   1. RLS 정책의 auth.uid() 호출을 (select auth.uid())로 교체
--      → 행마다 재평가되던 initplan 문제 해결 (성능 개선)
--   2. 모든 함수에 search_path = '' 설정
--      → search_path mutable 보안 취약점 해결
-- ============================================================

-- ============================================================
-- 1. events 테이블 RLS 정책 재정의 (auth.uid() → (select auth.uid()))
-- ============================================================

DROP POLICY IF EXISTS "enable_insert_events"  ON public.events;
DROP POLICY IF EXISTS "enable_update_events"  ON public.events;
DROP POLICY IF EXISTS "enable_delete_events"  ON public.events;

-- INSERT: host_id가 본인 uid와 일치해야 함
CREATE POLICY "enable_insert_events"
  ON public.events FOR INSERT
  WITH CHECK ((select auth.uid()) = host_id);

-- UPDATE: 주최자(host_id)만 수정 가능
CREATE POLICY "enable_update_events"
  ON public.events FOR UPDATE
  USING ((select auth.uid()) = host_id)
  WITH CHECK ((select auth.uid()) = host_id);

-- DELETE: 주최자(host_id)만 삭제 가능
CREATE POLICY "enable_delete_events"
  ON public.events FOR DELETE
  USING ((select auth.uid()) = host_id);

-- ============================================================
-- 2. event_participants 테이블 RLS 정책 재정의
-- ============================================================

DROP POLICY IF EXISTS "enable_insert_event_participants"  ON public.event_participants;
DROP POLICY IF EXISTS "enable_update_event_participants"  ON public.event_participants;
DROP POLICY IF EXISTS "enable_delete_event_participants"  ON public.event_participants;

-- INSERT: 본인 user_id로만 신청 가능
CREATE POLICY "enable_insert_event_participants"
  ON public.event_participants FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: 본인 또는 해당 이벤트 주최자가 상태 변경 가능
CREATE POLICY "enable_update_event_participants"
  ON public.event_participants FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participants.event_id
        AND host_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participants.event_id
        AND host_id = (select auth.uid())
    )
  );

-- DELETE: 본인 또는 해당 이벤트 주최자가 참가 레코드 삭제 가능
CREATE POLICY "enable_delete_event_participants"
  ON public.event_participants FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participants.event_id
        AND host_id = (select auth.uid())
    )
  );

-- ============================================================
-- 3. event_notices 테이블 RLS 정책 재정의
-- ============================================================

DROP POLICY IF EXISTS "enable_select_event_notices"  ON public.event_notices;
DROP POLICY IF EXISTS "enable_insert_event_notices"  ON public.event_notices;
DROP POLICY IF EXISTS "enable_update_event_notices"  ON public.event_notices;
DROP POLICY IF EXISTS "enable_delete_event_notices"  ON public.event_notices;

-- SELECT: 이벤트 주최자 또는 confirmed 참가자만 공지 열람 가능
CREATE POLICY "enable_select_event_notices"
  ON public.event_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id
        AND host_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_id = event_notices.event_id
        AND user_id = (select auth.uid())
        AND status = 'confirmed'
    )
  );

-- INSERT: 작성자가 본인이고 해당 이벤트의 주최자인 경우만 가능
CREATE POLICY "enable_insert_event_notices"
  ON public.event_notices FOR INSERT
  WITH CHECK (
    (select auth.uid()) = author_id
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id
        AND host_id = (select auth.uid())
    )
  );

-- UPDATE: 작성자(주최자)만 수정 가능
CREATE POLICY "enable_update_event_notices"
  ON public.event_notices FOR UPDATE
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

-- DELETE: 작성자이면서 해당 이벤트 주최자인 경우만 삭제 가능
CREATE POLICY "enable_delete_event_notices"
  ON public.event_notices FOR DELETE
  USING (
    (select auth.uid()) = author_id
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_notices.event_id
        AND host_id = (select auth.uid())
    )
  );

-- ============================================================
-- 4. 함수 search_path 보안 수정 (search_path mutable 취약점 해결)
-- ============================================================

-- update_updated_at_column 함수: search_path 고정
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- apply_to_event 함수: search_path 고정 (SECURITY DEFINER 유지)
CREATE OR REPLACE FUNCTION public.apply_to_event(
  p_event_id UUID,
  p_user_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event           public.events%ROWTYPE;
  v_confirmed_count INTEGER;
  v_order_number    INTEGER;
  v_new_status      VARCHAR(20);
  v_participant_id  UUID;
  v_existing        public.event_participants%ROWTYPE;
BEGIN
  SET LOCAL statement_timeout = '5s';

  -- 1단계: 이벤트 행 잠금 (SELECT FOR UPDATE)
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', '이벤트를 찾을 수 없습니다.'
    );
  END IF;

  IF v_event.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_ACTIVE',
      'message', '신청 가능한 이벤트가 아닙니다.'
    );
  END IF;

  IF v_event.event_date < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_EXPIRED',
      'message', '이미 종료된 이벤트입니다.'
    );
  END IF;

  -- 2단계: 기존 신청 여부 확인 (중복 신청 방지)
  SELECT * INTO v_existing
  FROM public.event_participants
  WHERE event_id = p_event_id
    AND user_id = p_user_id;

  IF FOUND THEN
    IF v_existing.status IN ('confirmed', 'waitlist') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'ALREADY_APPLIED',
        'message', '이미 신청한 이벤트입니다.',
        'currentStatus', v_existing.status
      );
    END IF;

    IF v_existing.status = 'cancelled' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'ALREADY_CANCELLED',
        'message', '취소한 이벤트는 재신청할 수 없습니다.'
      );
    END IF;
  END IF;

  -- 3단계: 현재 확정 참가자 수 계산
  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.event_participants
  WHERE event_id = p_event_id
    AND status = 'confirmed';

  -- 4단계: confirmed 또는 waitlist 결정
  IF v_confirmed_count < v_event.max_capacity THEN
    v_new_status := 'confirmed';
    v_order_number := v_confirmed_count + 1;
  ELSE
    v_new_status := 'waitlist';
    SELECT COUNT(*) + 1 INTO v_order_number
    FROM public.event_participants
    WHERE event_id = p_event_id
      AND status = 'waitlist';
    v_order_number := v_event.max_capacity + v_order_number;
  END IF;

  -- 5단계: 참가 레코드 생성
  INSERT INTO public.event_participants (
    event_id,
    user_id,
    status,
    order_number,
    applied_at
  )
  VALUES (
    p_event_id,
    p_user_id,
    v_new_status,
    v_order_number,
    NOW()
  )
  RETURNING id INTO v_participant_id;

  -- 6단계: 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'participantId', v_participant_id,
    'status', v_new_status,
    'orderNumber', v_order_number,
    'message', CASE
      WHEN v_new_status = 'confirmed' THEN '참가 신청이 확정되었습니다.'
      ELSE '정원이 초과되어 대기 명단에 등록되었습니다.'
    END
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_APPLICATION',
      'message', '이미 신청한 이벤트입니다.'
    );
  WHEN query_canceled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TIMEOUT',
      'message', '처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', '처리 중 오류가 발생했습니다.',
      'detail', SQLERRM
    );
END;
$$;

-- cancel_participation 함수: search_path 고정 (SECURITY DEFINER 유지)
CREATE OR REPLACE FUNCTION public.cancel_participation(
  p_event_id UUID,
  p_user_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event            public.events%ROWTYPE;
  v_participant      public.event_participants%ROWTYPE;
  v_promoted         public.event_participants%ROWTYPE;
  v_cancelled_order  INTEGER;
BEGIN
  SET LOCAL statement_timeout = '5s';

  -- 1단계: 이벤트 행 잠금 (SELECT FOR UPDATE)
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', '이벤트를 찾을 수 없습니다.'
    );
  END IF;

  -- 2단계: 참가 정보 조회 및 잠금
  SELECT * INTO v_participant
  FROM public.event_participants
  WHERE event_id = p_event_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_APPLIED',
      'message', '신청 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_participant.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_CANCELLED',
      'message', '이미 취소된 신청입니다.'
    );
  END IF;

  v_cancelled_order := v_participant.order_number;

  -- 3단계: 참가 취소 처리
  UPDATE public.event_participants
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = v_participant.id;

  -- 4단계: confirmed 취소 시 waitlist 첫 번째 자동 승격
  IF v_participant.status = 'confirmed' THEN
    SELECT * INTO v_promoted
    FROM public.event_participants
    WHERE event_id = p_event_id
      AND status = 'waitlist'
    ORDER BY order_number ASC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.event_participants
      SET status = 'confirmed',
          order_number = v_cancelled_order,
          updated_at = NOW()
      WHERE id = v_promoted.id;

      UPDATE public.event_participants
      SET order_number = order_number - 1,
          updated_at = NOW()
      WHERE event_id = p_event_id
        AND status = 'waitlist'
        AND order_number > v_promoted.order_number;

      RETURN jsonb_build_object(
        'success', true,
        'message', '참가 취소가 완료되었습니다.',
        'promoted', jsonb_build_object(
          'userId', v_promoted.user_id,
          'participantId', v_promoted.id,
          'newStatus', 'confirmed',
          'orderNumber', v_cancelled_order
        )
      );
    END IF;

    -- 대기자 없는 경우: confirmed 순번 재조정
    UPDATE public.event_participants
    SET order_number = order_number - 1,
        updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'confirmed'
      AND order_number > v_cancelled_order;
  END IF;

  -- 5단계: waitlist 취소 시 대기 순번 재조정
  IF v_participant.status = 'waitlist' THEN
    UPDATE public.event_participants
    SET order_number = order_number - 1,
        updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'waitlist'
      AND order_number > v_cancelled_order;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', '참가 취소가 완료되었습니다.'
  );

EXCEPTION
  WHEN query_canceled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TIMEOUT',
      'message', '처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', '처리 중 오류가 발생했습니다.',
      'detail', SQLERRM
    );
END;
$$;

-- 함수 실행 권한 재설정
REVOKE ALL ON FUNCTION public.apply_to_event(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_to_event(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_participation(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_participation(UUID, UUID) TO authenticated;
