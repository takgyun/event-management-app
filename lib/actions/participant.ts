'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireEventHost } from '@/lib/actions/_helpers';
import {
  mapDbParticipantToParticipant,
  mapDbParticipantsToParticipants,
  mapDbEventToEvent,
} from '@/lib/utils/db-mapper';
import type { ActionResult } from '@/lib/types';
import type { Participant, ParticipatingEvent, ParticipantStatus } from '@/lib/types';
import type { ApplyToEventResult, CancelParticipationResult, DbEvent } from '@/lib/supabase/types';

// ============================================================
// 참가 신청 / 취소
// ============================================================

/**
 * 이벤트 참가 신청 (인증 필요)
 *
 * apply_to_event RPC를 호출하여 참가 신청합니다.
 * 정원이 차면 waitlist 상태로 등록됩니다.
 * 성공 시 'participants' 태그 캐시를 무효화합니다.
 *
 * @param eventId - 신청할 이벤트 UUID
 * @returns ActionResult
 */
export async function applyEvent(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('apply_to_event', {
      p_event_id: eventId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[participant] applyEvent RPC 실패:', error.message);
      return { success: false, error: '참가 신청에 실패했습니다.' };
    }

    // RPC 반환값 검증
    const result = data as ApplyToEventResult;
    if (!result.success) {
      console.error('[participant] applyEvent 비즈니스 로직 실패:', result.error);
      return { success: false, error: result.error ?? '참가 신청에 실패했습니다.' };
    }

    // 참가자 목록 및 이벤트 캐시 무효화
    revalidatePath('/events', 'page');

    return { success: true, data: undefined };
  } catch (err) {
    console.error('[participant] applyEvent 예외 발생:', err);
    return { success: false, error: '참가 신청 중 오류가 발생했습니다.' };
  }
}

/**
 * 이벤트 참가 취소 (인증 필요)
 *
 * cancel_participation RPC를 호출하여 참가를 취소합니다.
 * 대기자가 있으면 자동으로 confirmed 상태로 승격됩니다.
 * 성공 시 'participants' 태그 캐시를 무효화합니다.
 *
 * @param eventId - 취소할 이벤트 UUID
 * @returns ActionResult
 */
export async function cancelParticipation(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('cancel_participation', {
      p_event_id: eventId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[participant] cancelParticipation RPC 실패:', error.message);
      return { success: false, error: '참가 취소에 실패했습니다.' };
    }

    // RPC 반환값 검증
    const result = data as CancelParticipationResult;
    if (!result.success) {
      console.error('[participant] cancelParticipation 비즈니스 로직 실패:', result.error);
      return { success: false, error: result.error ?? '참가 취소에 실패했습니다.' };
    }

    // 대기자 승격 여부 확인 (비즈니스 로직 검증용)
    if (result.promoted) {
      console.warn(
        `[participant] 대기자 승격: userId=${result.promoted.userId}, ` +
          `participantId=${result.promoted.participantId}, ` +
          `orderNumber=${result.promoted.orderNumber}`
      );
    }

    // 참가자 목록 및 이벤트 캐시 무효화
    revalidatePath('/events', 'page');

    return { success: true, data: undefined };
  } catch (err) {
    console.error('[participant] cancelParticipation 예외 발생:', err);
    return { success: false, error: '참가 취소 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 참가자 조회
// ============================================================

/**
 * 이벤트 참가자 목록 조회 (주최자만 가능)
 *
 * 해당 이벤트의 모든 참가자를 신청 순서대로 조회합니다.
 *
 * @param eventId - 조회할 이벤트 UUID
 * @returns ActionResult<Participant[]>
 */
export async function getEventParticipants(eventId: string): Promise<ActionResult<Participant[]>> {
  try {
    // 주최자 권한 확인
    await requireEventHost(eventId);
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .order('order_number', { ascending: true });

    if (error) {
      console.error('[participant] getEventParticipants 조회 실패:', error.message);
      return { success: false, error: '참가자 목록 조회에 실패했습니다.' };
    }

    const participants = mapDbParticipantsToParticipants(rows ?? []);
    return { success: true, data: participants };
  } catch (err) {
    // requireEventHost에서 throw한 권한 에러 처리
    if (err instanceof Error) {
      console.error('[participant] getEventParticipants 권한 오류:', err.message);
      return { success: false, error: err.message };
    }
    console.error('[participant] getEventParticipants 예외 발생:', err);
    return { success: false, error: '참가자 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 내가 참가 신청한 이벤트 목록 조회 (인증 필요)
 *
 * 참가자 테이블과 이벤트 테이블을 조인하여 참가 상태와 함께 반환합니다.
 * 취소된 이벤트와 취소된 참가 기록은 제외합니다.
 *
 * @returns ActionResult<ParticipatingEvent[]>
 */
export async function getMyParticipatingEvents(): Promise<ActionResult<ParticipatingEvent[]>> {
  try {
    const userId = await requireAuth();
    const supabase = await createClient();

    // 이벤트 참가 기록과 이벤트 정보 조인 조회
    const { data: rows, error } = await supabase
      .from('event_participants')
      .select(
        `
        status,
        events (*)
      `
      )
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('[participant] getMyParticipatingEvents 조회 실패:', error.message);
      return { success: false, error: '참가 이벤트 목록 조회에 실패했습니다.' };
    }

    // 취소된 이벤트 제외하고 ParticipatingEvent 타입으로 변환
    const participatingEvents: ParticipatingEvent[] = (rows ?? [])
      .filter((row) => {
        const event = row.events as unknown as DbEvent | null;
        return event && event.status !== 'cancelled';
      })
      .map((row) => {
        const event = row.events as unknown as DbEvent;
        return {
          ...mapDbEventToEvent(event),
          participantStatus: row.status as ParticipantStatus,
        };
      });

    return { success: true, data: participatingEvents };
  } catch (err) {
    console.error('[participant] getMyParticipatingEvents 예외 발생:', err);
    return { success: false, error: '참가 이벤트 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 이벤트에 대한 사용자의 참가 상태 조회
 *
 * userId가 없으면 현재 인증된 사용자의 상태를 조회합니다.
 * 주최자 또는 본인만 조회 가능합니다.
 *
 * @param eventId - 조회할 이벤트 UUID
 * @param userId - 조회할 사용자 UUID (없으면 현재 사용자)
 * @returns ActionResult<Participant | null>
 */
export async function getUserParticipationStatus(
  eventId: string,
  userId?: string
): Promise<ActionResult<Participant | null>> {
  try {
    const currentUserId = await requireAuth();

    // userId가 명시된 경우 주최자 본인이거나 본인 정보만 조회 가능
    const targetUserId = userId ?? currentUserId;

    if (targetUserId !== currentUserId) {
      // 다른 사용자 조회 시 주최자 권한 확인
      const supabaseForCheck = await createClient();
      const { data: event, error: eventError } = await supabaseForCheck
        .from('events')
        .select('host_id')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return { success: false, error: '이벤트를 찾을 수 없습니다.' };
      }

      if (event.host_id !== currentUserId) {
        return { success: false, error: '다른 사용자의 참가 상태는 주최자만 조회할 수 있습니다.' };
      }
    }

    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) {
      console.error('[participant] getUserParticipationStatus 조회 실패:', error.message);
      return { success: false, error: '참가 상태 조회에 실패했습니다.' };
    }

    // 참가 기록 없는 경우 null 반환 (정상 케이스)
    if (!row) {
      return { success: true, data: null };
    }

    return { success: true, data: mapDbParticipantToParticipant(row) };
  } catch (err) {
    console.error('[participant] getUserParticipationStatus 예외 발생:', err);
    return { success: false, error: '참가 상태 조회 중 오류가 발생했습니다.' };
  }
}
