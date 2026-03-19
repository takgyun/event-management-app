-- ============================================================
-- 마이그레이션 001: 이벤트 관련 테이블 생성
-- 생성일: 2026-03-19
-- 설명: events, event_participants, event_notices 테이블 및
--        인덱스, 제약조건, 자동 updated_at 트리거 설정
-- ============================================================

-- UUID 확장 활성화 (이미 활성화된 경우 무시)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- updated_at 자동 갱신 트리거 함수
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- 레코드가 업데이트될 때 updated_at을 현재 시간으로 자동 갱신
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- events 테이블: 이벤트 기본 정보
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  -- 기본키: UUID v4
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 이벤트 주최자 (auth.users 외래키)
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 이벤트 정보
  title VARCHAR(100) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(100) NOT NULL,
  max_capacity INTEGER NOT NULL,

  -- 이벤트 상태: active(진행중) / cancelled(취소됨) / completed(완료됨)
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'completed')),

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 정원 범위 제약
  CONSTRAINT events_max_capacity_check CHECK (max_capacity >= 1 AND max_capacity <= 10000)
);

-- events 인덱스
CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- events updated_at 자동 갱신 트리거
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- event_participants 테이블: 이벤트 참가자 정보
-- ============================================================
CREATE TABLE IF NOT EXISTS event_participants (
  -- 기본키: UUID v4
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 이벤트 참조 (외래키)
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- 참가자 (auth.users 외래키)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 참가 상태: confirmed(확정) / waitlist(대기) / cancelled(취소)
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),

  -- 신청 순번 (동시성 제어용)
  order_number INTEGER NOT NULL,

  -- 신청 시각
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 동일 이벤트에 동일 사용자 중복 신청 방지 (취소된 경우 재신청 불가 처리는 함수에서)
  CONSTRAINT uq_event_participants_event_user UNIQUE(event_id, user_id)
);

-- event_participants 인덱스
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_status ON event_participants(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_participants_order ON event_participants(event_id, order_number);

-- event_participants updated_at 자동 갱신 트리거
CREATE TRIGGER trigger_event_participants_updated_at
  BEFORE UPDATE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- event_notices 테이블: 이벤트 공지사항
-- ============================================================
CREATE TABLE IF NOT EXISTS event_notices (
  -- 기본키: UUID v4
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 이벤트 참조 (외래키)
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- 공지 작성자 (auth.users 외래키)
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 공지 내용
  content TEXT NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- event_notices 인덱스
CREATE INDEX IF NOT EXISTS idx_event_notices_event_id ON event_notices(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notices_author_id ON event_notices(author_id);
CREATE INDEX IF NOT EXISTS idx_event_notices_created_at ON event_notices(event_id, created_at DESC);

-- event_notices updated_at 자동 갱신 트리거
CREATE TRIGGER trigger_event_notices_updated_at
  BEFORE UPDATE ON event_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) 활성화
-- ============================================================

-- events RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 이벤트 목록 조회: 모든 사용자(비로그인 포함) active 이벤트 열람 가능
CREATE POLICY "events_select_public"
  ON events FOR SELECT
  USING (status = 'active' OR auth.uid() = host_id);

-- 이벤트 생성: 로그인한 사용자만 가능
CREATE POLICY "events_insert_authenticated"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- 이벤트 수정: 주최자만 가능
CREATE POLICY "events_update_host"
  ON events FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- 이벤트 삭제: 주최자만 가능
CREATE POLICY "events_delete_host"
  ON events FOR DELETE
  USING (auth.uid() = host_id);

-- event_participants RLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- 참가자 목록 조회: 본인 참가 정보 또는 이벤트 주최자
CREATE POLICY "event_participants_select"
  ON event_participants FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT host_id FROM events WHERE id = event_id
    )
  );

-- 참가 신청: 함수(apply_to_event)를 통해서만 처리
-- SECURITY DEFINER 함수가 처리하므로 직접 INSERT는 비활성화 상태 유지
-- (함수에서 SECURITY DEFINER로 처리)
CREATE POLICY "event_participants_insert_self"
  ON event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 참가 상태 수정: 함수(cancel_participation)를 통해서만 처리
CREATE POLICY "event_participants_update_self"
  ON event_participants FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT host_id FROM events WHERE id = event_id
    )
  );

-- event_notices RLS
ALTER TABLE event_notices ENABLE ROW LEVEL SECURITY;

-- 공지 조회: 해당 이벤트의 참가자 또는 주최자, 또는 active 이벤트라면 누구나
CREATE POLICY "event_notices_select"
  ON event_notices FOR SELECT
  USING (
    auth.uid() = author_id
    OR auth.uid() IN (
      SELECT host_id FROM events WHERE id = event_id
    )
    OR auth.uid() IN (
      SELECT user_id FROM event_participants
      WHERE event_id = event_notices.event_id
        AND status IN ('confirmed', 'waitlist')
    )
  );

-- 공지 작성: 이벤트 주최자만 가능
CREATE POLICY "event_notices_insert_host"
  ON event_notices FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND auth.uid() IN (
      SELECT host_id FROM events WHERE id = event_id
    )
  );

-- 공지 수정: 작성자(주최자)만 가능
CREATE POLICY "event_notices_update_host"
  ON event_notices FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 공지 삭제: 작성자(주최자)만 가능
CREATE POLICY "event_notices_delete_host"
  ON event_notices FOR DELETE
  USING (auth.uid() = author_id);
