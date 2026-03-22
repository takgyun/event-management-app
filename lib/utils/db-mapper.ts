/**
 * DB 행(Row) -> 도메인 타입 변환 매핑 레이어
 *
 * Supabase DB의 snake_case 컬럼명을 도메인 타입의 camelCase로 변환합니다.
 * 또한 DB의 느슨한 string 타입을 도메인의 enum 타입으로 안전하게 캐스팅합니다.
 */

import type { DbEvent, DbNotice, DbParticipant } from '@/lib/supabase/types';
import type {
  Event,
  EventStatus,
  EventWithStats,
  Notice,
  Participant,
  ParticipantStatus,
  User,
} from '@/lib/types';

// ============================================================
// 내부 헬퍼: enum 변환 함수
// ============================================================

/**
 * DB의 status 문자열을 EventStatus enum으로 변환
 * 알 수 없는 값은 'active'로 폴백 (안전한 기본값)
 */
function toEventStatus(status: string): EventStatus {
  const validStatuses: EventStatus[] = ['active', 'cancelled', 'completed'];
  if (validStatuses.includes(status as EventStatus)) {
    return status as EventStatus;
  }
  // 예상치 못한 DB 값에 대한 안전한 폴백
  console.warn(`[db-mapper] 알 수 없는 EventStatus 값: "${status}", "active"로 폴백합니다.`);
  return 'active';
}

/**
 * DB의 status 문자열을 ParticipantStatus enum으로 변환
 * 알 수 없는 값은 'confirmed'로 폴백 (안전한 기본값)
 */
function toParticipantStatus(status: string): ParticipantStatus {
  const validStatuses: ParticipantStatus[] = ['confirmed', 'waitlist', 'cancelled'];
  if (validStatuses.includes(status as ParticipantStatus)) {
    return status as ParticipantStatus;
  }
  console.warn(
    `[db-mapper] 알 수 없는 ParticipantStatus 값: "${status}", "confirmed"로 폴백합니다.`
  );
  return 'confirmed';
}

// ============================================================
// 공개 매핑 함수
// ============================================================

/**
 * DB events Row -> 도메인 Event 타입 변환
 *
 * @param row - Supabase events 테이블 Row
 * @returns 도메인 Event 객체 (camelCase)
 */
export function mapDbEventToEvent(row: DbEvent): Event {
  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    description: row.description,
    // 날짜는 ISO 8601 문자열 그대로 유지 (UI에서 필요에 따라 포맷)
    eventDate: row.event_date,
    location: row.location,
    maxCapacity: row.max_capacity,
    status: toEventStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * DB event_participants Row -> 도메인 Participant 타입 변환
 *
 * @param row - Supabase event_participants 테이블 Row
 * @returns 도메인 Participant 객체 (camelCase)
 */
export function mapDbParticipantToParticipant(row: DbParticipant): Participant {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: toParticipantStatus(row.status),
    // 날짜는 ISO 8601 문자열 그대로 유지
    appliedAt: row.applied_at,
    orderNumber: row.order_number,
  };
}

/**
 * DB event_notices Row -> 도메인 Notice 타입 변환
 *
 * @param row - Supabase event_notices 테이블 Row
 * @returns 도메인 Notice 객체 (camelCase)
 */
export function mapDbNoticeToNotice(row: DbNotice): Notice {
  return {
    id: row.id,
    eventId: row.event_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================
// 복합 빌더 함수
// ============================================================

/**
 * 이벤트 통계 정보를 포함한 EventWithStats 객체 생성
 *
 * @param event - 도메인 Event 객체
 * @param stats - 참가자 통계 (확정/대기 수)
 * @param host - 주최자 사용자 정보
 * @returns EventWithStats 객체
 */
export function buildEventWithStats(
  event: Event,
  stats: { confirmedCount: number; waitlistCount: number },
  host: User
): EventWithStats {
  return {
    ...event,
    confirmedCount: stats.confirmedCount,
    waitlistCount: stats.waitlistCount,
    host,
  };
}

/**
 * 이벤트 목록 행 배열을 도메인 Event 배열로 일괄 변환
 *
 * @param rows - Supabase events 테이블 Row 배열
 * @returns 도메인 Event 배열
 */
export function mapDbEventsToEvents(rows: DbEvent[]): Event[] {
  return rows.map(mapDbEventToEvent);
}

/**
 * 참가자 목록 행 배열을 도메인 Participant 배열로 일괄 변환
 *
 * @param rows - Supabase event_participants 테이블 Row 배열
 * @returns 도메인 Participant 배열
 */
export function mapDbParticipantsToParticipants(rows: DbParticipant[]): Participant[] {
  return rows.map(mapDbParticipantToParticipant);
}

/**
 * 공지사항 목록 행 배열을 도메인 Notice 배열로 일괄 변환
 *
 * @param rows - Supabase event_notices 테이블 Row 배열
 * @returns 도메인 Notice 배열
 */
export function mapDbNoticesToNotices(rows: DbNotice[]): Notice[] {
  return rows.map(mapDbNoticeToNotice);
}
