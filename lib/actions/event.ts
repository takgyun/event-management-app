'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireEventHost } from '@/lib/actions/_helpers';
import { createEventSchema, updateEventSchema } from '@/lib/validations/event';
import {
  mapDbEventToEvent,
  mapDbEventToEvent as mapEvent,
  buildEventWithStats,
} from '@/lib/utils/db-mapper';
import type { ActionResult } from '@/lib/types';
import type { Event, EventWithStats, User } from '@/lib/types';
import type { DbEvent } from '@/lib/supabase/types';

// ============================================================
// 내부 헬퍼: 이벤트 + 통계 + 주최자 조합
// ============================================================

/**
 * DB 이벤트 행과 참가자 통계, 주최자 정보로 EventWithStats 객체 생성
 *
 * @param row - events 테이블 Row
 * @param supabase - Supabase 클라이언트
 * @returns EventWithStats 객체
 */
async function buildEventWithStatsFromRow(
  row: DbEvent,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<EventWithStats> {
  const event = mapDbEventToEvent(row);

  // 참가자 통계 조회 (confirmed, waitlist 각각 카운트)
  const { data: participants } = await supabase
    .from('event_participants')
    .select('status')
    .eq('event_id', row.id)
    .in('status', ['confirmed', 'waitlist']);

  const confirmedCount = participants?.filter((p) => p.status === 'confirmed').length ?? 0;
  const waitlistCount = participants?.filter((p) => p.status === 'waitlist').length ?? 0;

  // 주최자 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', row.host_id)
    .single();

  const host: User = {
    id: row.host_id,
    email: '', // profiles 테이블에는 email 없음 (auth.users 별도)
    name: profile?.full_name ?? profile?.username ?? null,
  };

  return buildEventWithStats(event, { confirmedCount, waitlistCount }, host);
}

// ============================================================
// 공개 조회 함수
// ============================================================

/**
 * 전체 이벤트 목록 조회 (공개, 취소되지 않은 이벤트)
 *
 * @returns EventWithStats 배열 (이벤트 날짜 오름차순)
 */
export async function getEvents(): Promise<EventWithStats[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from('events')
    .select('*')
    .neq('status', 'cancelled')
    .order('event_date', { ascending: true });

  if (error || !rows) {
    console.error('[event] getEvents 조회 실패:', error?.message);
    return [];
  }

  // 각 이벤트에 대한 통계 병렬 조회
  const events = await Promise.all(rows.map((row) => buildEventWithStatsFromRow(row, supabase)));

  return events;
}

/**
 * 이벤트 상세 조회
 *
 * @param id - 이벤트 UUID
 * @returns ActionResult<EventWithStats>
 */
export async function getEventById(id: string): Promise<ActionResult<EventWithStats>> {
  const supabase = await createClient();

  const { data: row, error } = await supabase.from('events').select('*').eq('id', id).single();

  if (error || !row) {
    console.error('[event] getEventById 조회 실패:', error?.message);
    return { success: false, error: '이벤트를 찾을 수 없습니다.' };
  }

  try {
    const eventWithStats = await buildEventWithStatsFromRow(row, supabase);
    return { success: true, data: eventWithStats };
  } catch (err) {
    console.error('[event] getEventById 통계 조합 실패:', err);
    return { success: false, error: '이벤트 정보를 불러오는데 실패했습니다.' };
  }
}

/**
 * 내가 주최한 이벤트 목록 조회 (인증 필요)
 *
 * @returns ActionResult<EventWithStats[]>
 */
export async function getMyHostedEvents(): Promise<ActionResult<EventWithStats[]>> {
  try {
    const userId = await requireAuth();
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', userId)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('[event] getMyHostedEvents 조회 실패:', error.message);
      return { success: false, error: '주최 이벤트 목록 조회에 실패했습니다.' };
    }

    const events = await Promise.all(
      (rows ?? []).map((row) => buildEventWithStatsFromRow(row, supabase))
    );

    return { success: true, data: events };
  } catch (err) {
    console.error('[event] getMyHostedEvents 예외 발생:', err);
    return { success: false, error: '주최 이벤트 목록 조회에 실패했습니다.' };
  }
}

// ============================================================
// 이벤트 변경 함수
// ============================================================

/**
 * 이벤트 생성 (인증 필요)
 *
 * FormData에서 이벤트 정보를 추출하여 검증 후 DB에 삽입합니다.
 * 성공 시 'events' 태그 캐시를 무효화합니다.
 *
 * @param formData - 이벤트 생성 폼 데이터
 * @returns ActionResult<Event>
 */
export async function createEvent(formData: FormData): Promise<ActionResult<Event>> {
  try {
    const userId = await requireAuth();

    // FormData에서 값 추출
    const rawData = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) ?? '',
      eventDate: formData.get('eventDate') as string,
      location: formData.get('location') as string,
      // number 타입으로 변환
      maxCapacity: Number(formData.get('maxCapacity')),
    };

    // Zod 스키마 검증
    const validation = createEventSchema.safeParse(rawData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return {
        success: false,
        error: '입력값이 올바르지 않습니다.',
        fieldErrors,
      };
    }

    const validated = validation.data;
    const supabase = await createClient();

    // events 테이블에 삽입
    const { data: row, error } = await supabase
      .from('events')
      .insert({
        host_id: userId,
        title: validated.title,
        description: validated.description || null,
        event_date: validated.eventDate,
        location: validated.location,
        max_capacity: validated.maxCapacity,
        status: 'active',
      })
      .select()
      .single();

    if (error || !row) {
      console.error('[event] createEvent 삽입 실패:', error?.message);
      return { success: false, error: '이벤트 생성에 실패했습니다.' };
    }

    // 캐시 무효화
    revalidatePath('/events', 'page');

    return { success: true, data: mapEvent(row) };
  } catch (err) {
    console.error('[event] createEvent 예외 발생:', err);
    return { success: false, error: '이벤트 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 이벤트 수정 (주최자만 가능)
 *
 * title, description, location 필드를 선택적으로 수정합니다.
 * 성공 시 'events' 태그 캐시를 무효화합니다.
 *
 * @param id - 수정할 이벤트 UUID
 * @param formData - 수정할 이벤트 폼 데이터
 * @returns ActionResult<Event>
 */
export async function updateEvent(id: string, formData: FormData): Promise<ActionResult<Event>> {
  try {
    // 주최자 권한 확인
    await requireEventHost(id);

    // FormData에서 값 추출 (있는 경우에만)
    const rawData: Record<string, string> = {};
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const location = formData.get('location') as string | null;

    if (title !== null && title !== '') rawData.title = title;
    if (description !== null) rawData.description = description;
    if (location !== null && location !== '') rawData.location = location;

    // Zod 스키마 검증
    const validation = updateEventSchema.safeParse(rawData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors as Record<string, string[]>;
      return {
        success: false,
        error: '입력값이 올바르지 않습니다.',
        fieldErrors,
      };
    }

    const validated = validation.data;

    // 수정할 필드가 없는 경우
    if (Object.keys(validated).length === 0) {
      return { success: false, error: '수정할 내용이 없습니다.' };
    }

    const supabase = await createClient();

    // DB 업데이트 (snake_case 변환)
    const updatePayload: Record<string, string | null> = {};
    if (validated.title !== undefined) updatePayload.title = validated.title;
    if (validated.description !== undefined)
      updatePayload.description = validated.description || null;
    if (validated.location !== undefined) updatePayload.location = validated.location;

    const { data: row, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !row) {
      console.error('[event] updateEvent 수정 실패:', error?.message);
      return { success: false, error: '이벤트 수정에 실패했습니다.' };
    }

    // 캐시 무효화
    revalidatePath('/events', 'page');

    return { success: true, data: mapEvent(row) };
  } catch (err) {
    // requireEventHost에서 throw한 권한 에러 처리
    if (err instanceof Error) {
      console.error('[event] updateEvent 권한 오류:', err.message);
      return { success: false, error: err.message };
    }
    console.error('[event] updateEvent 예외 발생:', err);
    return { success: false, error: '이벤트 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 이벤트 취소 (주최자만 가능)
 *
 * 이벤트 status를 'cancelled'로 변경합니다.
 * 성공 시 'events' 태그 캐시를 무효화합니다.
 *
 * @param id - 취소할 이벤트 UUID
 * @returns ActionResult
 */
export async function cancelEvent(id: string): Promise<ActionResult> {
  try {
    // 주최자 권한 확인
    await requireEventHost(id);

    const supabase = await createClient();

    const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', id);

    if (error) {
      console.error('[event] cancelEvent 취소 실패:', error.message);
      return { success: false, error: '이벤트 취소에 실패했습니다.' };
    }

    // 캐시 무효화
    revalidatePath('/events', 'page');

    return { success: true, data: undefined };
  } catch (err) {
    // requireEventHost에서 throw한 권한 에러 처리
    if (err instanceof Error) {
      console.error('[event] cancelEvent 권한 오류:', err.message);
      return { success: false, error: err.message };
    }
    console.error('[event] cancelEvent 예외 발생:', err);
    return { success: false, error: '이벤트 취소 중 오류가 발생했습니다.' };
  }
}
