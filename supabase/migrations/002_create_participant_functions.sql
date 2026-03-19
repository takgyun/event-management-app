-- ============================================================
-- 마이그레이션 002: 참가 신청/취소 함수 생성
-- 생성일: 2026-03-19
-- 설명: Race Condition 방지를 위한 FOR UPDATE 트랜잭션 기반
--        이벤트 참가 신청(apply_to_event) 및
--        참가 취소(cancel_participation) 함수 구현
-- ============================================================

-- ============================================================
-- apply_to_event: 이벤트 참가 신청 함수
-- - SELECT FOR UPDATE로 이벤트 행 잠금 (동시성 안전)
-- - 정원 초과 시 자동으로 waitlist 처리
-- - 중복 신청 방지
-- - statement_timeout으로 데드락 방지
-- ============================================================
CREATE OR REPLACE FUNCTION apply_to_event(
  p_event_id UUID,  -- 신청할 이벤트 ID
  p_user_id  UUID   -- 신청할 사용자 ID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- 함수 소유자 권한으로 실행 (RLS 우회)
AS $$
DECLARE
  v_event           events%ROWTYPE;         -- 이벤트 정보
  v_confirmed_count INTEGER;                -- 현재 확정 참가자 수
  v_order_number    INTEGER;                -- 신청 순번
  v_new_status      VARCHAR(20);            -- 신청 결과 상태
  v_participant_id  UUID;                   -- 생성된 참가 레코드 ID
  v_existing        event_participants%ROWTYPE; -- 기존 신청 정보
BEGIN
  -- 데드락 방지를 위한 statement 타임아웃 설정 (5초)
  SET LOCAL statement_timeout = '5s';

  -- --------------------------------------------------------
  -- 1단계: 이벤트 행 잠금 (SELECT FOR UPDATE)
  --        다른 트랜잭션이 동시에 같은 이벤트를 수정하지 못하도록 잠금
  -- --------------------------------------------------------
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  -- 이벤트 존재 여부 확인
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', '이벤트를 찾을 수 없습니다.'
    );
  END IF;

  -- 이벤트 상태 확인 (active 상태만 신청 가능)
  IF v_event.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_ACTIVE',
      'message', '신청 가능한 이벤트가 아닙니다.'
    );
  END IF;

  -- 이벤트 날짜 확인 (이미 지난 이벤트는 신청 불가)
  IF v_event.event_date < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_EXPIRED',
      'message', '이미 종료된 이벤트입니다.'
    );
  END IF;

  -- --------------------------------------------------------
  -- 2단계: 기존 신청 여부 확인 (중복 신청 방지)
  -- --------------------------------------------------------
  SELECT * INTO v_existing
  FROM event_participants
  WHERE event_id = p_event_id
    AND user_id = p_user_id;

  IF FOUND THEN
    -- 이미 활성 상태로 신청된 경우
    IF v_existing.status IN ('confirmed', 'waitlist') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'ALREADY_APPLIED',
        'message', '이미 신청한 이벤트입니다.',
        'currentStatus', v_existing.status
      );
    END IF;

    -- 이전에 취소한 경우 재신청 불가 (정책에 따라 변경 가능)
    IF v_existing.status = 'cancelled' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'ALREADY_CANCELLED',
        'message', '취소한 이벤트는 재신청할 수 없습니다.'
      );
    END IF;
  END IF;

  -- --------------------------------------------------------
  -- 3단계: 현재 확정 참가자 수 계산 (잠금된 상태에서 안전하게 조회)
  -- --------------------------------------------------------
  SELECT COUNT(*) INTO v_confirmed_count
  FROM event_participants
  WHERE event_id = p_event_id
    AND status = 'confirmed';

  -- --------------------------------------------------------
  -- 4단계: 정원 비교하여 confirmed 또는 waitlist 결정
  -- --------------------------------------------------------
  IF v_confirmed_count < v_event.max_capacity THEN
    -- 정원 여유 있음: 확정 처리
    v_new_status := 'confirmed';

    -- 확정 순번: 현재 확정 인원 + 1
    v_order_number := v_confirmed_count + 1;
  ELSE
    -- 정원 초과: 대기 처리
    v_new_status := 'waitlist';

    -- 대기 순번: 현재 대기 인원 수 + 1 (확정 최대 정원 이후)
    SELECT COUNT(*) + 1 INTO v_order_number
    FROM event_participants
    WHERE event_id = p_event_id
      AND status = 'waitlist';

    -- 대기 순번은 max_capacity 이후부터 시작 (시각적 표시용)
    v_order_number := v_event.max_capacity + v_order_number;
  END IF;

  -- --------------------------------------------------------
  -- 5단계: 참가 레코드 생성
  -- --------------------------------------------------------
  INSERT INTO event_participants (
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

  -- --------------------------------------------------------
  -- 6단계: 결과 반환
  -- --------------------------------------------------------
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
    -- UNIQUE 제약 위반: 동시에 같은 사용자가 두 번 신청한 경우
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_APPLICATION',
      'message', '이미 신청한 이벤트입니다.'
    );
  WHEN query_canceled THEN
    -- statement_timeout 초과 시 발생하는 예외 (데드락 또는 지연)
    -- PL/pgSQL에서 statement_timeout은 query_canceled로 캐치해야 함
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TIMEOUT',
      'message', '처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    );
  WHEN OTHERS THEN
    -- 기타 예외 처리
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', '처리 중 오류가 발생했습니다.',
      'detail', SQLERRM
    );
END;
$$;

-- ============================================================
-- cancel_participation: 이벤트 참가 취소 함수
-- - SELECT FOR UPDATE로 이벤트 행 잠금 (동시성 안전)
-- - confirmed 취소 시 waitlist 첫 번째 자동 승격
-- - order_number 재조정
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_participation(
  p_event_id UUID,  -- 취소할 이벤트 ID
  p_user_id  UUID   -- 취소할 사용자 ID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- 함수 소유자 권한으로 실행 (RLS 우회)
AS $$
DECLARE
  v_event            events%ROWTYPE;           -- 이벤트 정보
  v_participant      event_participants%ROWTYPE; -- 취소할 참가 정보
  v_promoted         event_participants%ROWTYPE; -- 승격될 대기자 정보
  v_cancelled_order  INTEGER;                  -- 취소된 참가자의 순번
BEGIN
  -- 데드락 방지를 위한 statement 타임아웃 설정 (5초)
  SET LOCAL statement_timeout = '5s';

  -- --------------------------------------------------------
  -- 1단계: 이벤트 행 잠금 (SELECT FOR UPDATE)
  -- --------------------------------------------------------
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  -- 이벤트 존재 여부 확인
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', '이벤트를 찾을 수 없습니다.'
    );
  END IF;

  -- --------------------------------------------------------
  -- 2단계: 참가 정보 조회 및 잠금
  -- --------------------------------------------------------
  SELECT * INTO v_participant
  FROM event_participants
  WHERE event_id = p_event_id
    AND user_id = p_user_id
  FOR UPDATE;

  -- 참가 정보 존재 여부 확인
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_APPLIED',
      'message', '신청 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 이미 취소된 경우
  IF v_participant.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_CANCELLED',
      'message', '이미 취소된 신청입니다.'
    );
  END IF;

  -- 취소 전 순번 저장
  v_cancelled_order := v_participant.order_number;

  -- --------------------------------------------------------
  -- 3단계: 참가 취소 처리
  -- --------------------------------------------------------
  UPDATE event_participants
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = v_participant.id;

  -- --------------------------------------------------------
  -- 4단계: confirmed 취소 시 waitlist 첫 번째 자동 승격
  -- --------------------------------------------------------
  IF v_participant.status = 'confirmed' THEN
    -- 대기 명단에서 가장 앞 순번의 참가자 선택 (잠금 포함)
    SELECT * INTO v_promoted
    FROM event_participants
    WHERE event_id = p_event_id
      AND status = 'waitlist'
    ORDER BY order_number ASC
    LIMIT 1
    FOR UPDATE;

    -- 대기자가 있는 경우 승격 처리
    IF FOUND THEN
      -- 대기자를 confirmed로 승격, 취소된 자리의 순번 부여
      UPDATE event_participants
      SET status = 'confirmed',
          order_number = v_cancelled_order,
          updated_at = NOW()
      WHERE id = v_promoted.id;

      -- 승격된 대기자 이후의 대기 순번 재조정
      -- 승격된 대기자의 기존 순번보다 큰 대기자들의 순번을 1씩 감소
      UPDATE event_participants
      SET order_number = order_number - 1,
          updated_at = NOW()
      WHERE event_id = p_event_id
        AND status = 'waitlist'
        AND order_number > v_promoted.order_number;

      -- 결과 반환 (승격 정보 포함)
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

    -- 대기자가 없는 경우: 취소된 이후 confirmed 순번 재조정
    -- 취소된 순번보다 큰 confirmed 참가자들의 순번을 1씩 감소
    UPDATE event_participants
    SET order_number = order_number - 1,
        updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'confirmed'
      AND order_number > v_cancelled_order;
  END IF;

  -- --------------------------------------------------------
  -- 5단계: waitlist 취소 시 대기 순번 재조정
  -- --------------------------------------------------------
  IF v_participant.status = 'waitlist' THEN
    -- 취소된 대기 순번보다 큰 대기자들의 순번을 1씩 감소
    UPDATE event_participants
    SET order_number = order_number - 1,
        updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'waitlist'
      AND order_number > v_cancelled_order;
  END IF;

  -- --------------------------------------------------------
  -- 6단계: 결과 반환
  -- --------------------------------------------------------
  RETURN jsonb_build_object(
    'success', true,
    'message', '참가 취소가 완료되었습니다.'
  );

EXCEPTION
  WHEN query_canceled THEN
    -- statement_timeout 초과 시 발생하는 예외
    -- PL/pgSQL에서 statement_timeout은 query_canceled로 캐치해야 함
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

-- ============================================================
-- 함수 실행 권한 설정
-- authenticated 사용자만 함수 호출 가능
-- ============================================================
REVOKE ALL ON FUNCTION apply_to_event(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_to_event(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION cancel_participation(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_participation(UUID, UUID) TO authenticated;
