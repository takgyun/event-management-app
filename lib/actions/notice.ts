'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireEventHost } from '@/lib/actions/_helpers';
import { mapDbNoticeToNotice, mapDbNoticesToNotices } from '@/lib/utils/db-mapper';
import type { ActionResult } from '@/lib/types';
import type { Notice } from '@/lib/types';

// ============================================================
// 공지사항 조회
// ============================================================

/**
 * 이벤트 공지사항 목록 조회 (주최자 또는 confirmed 참가자)
 *
 * 주최자이거나 confirmed 상태의 참가자만 공지사항을 조회할 수 있습니다.
 * 최신 공지사항이 먼저 반환됩니다 (created_at DESC).
 *
 * @param eventId - 조회할 이벤트 UUID
 * @returns ActionResult<Notice[]>
 */
export async function getEventNotices(eventId: string): Promise<ActionResult<Notice[]>> {
  try {
    // 인증 확인
    const userId = await requireAuth();
    const supabase = await createClient();

    // 이벤트 host_id 조회
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('[notice] getEventNotices 이벤트 조회 실패:', eventError?.message);
      return { success: false, error: '이벤트를 찾을 수 없습니다.' };
    }

    // 주최자 여부 확인
    const isHost = event.host_id === userId;

    if (!isHost) {
      // confirmed 참가자 여부 확인
      const { data: participant, error: participantError } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) {
        console.error('[notice] getEventNotices 참가자 조회 실패:', participantError.message);
        return { success: false, error: '공지사항을 조회할 권한이 없습니다.' };
      }

      // 참가자가 아니거나 confirmed 상태가 아닌 경우 차단
      if (!participant || participant.status !== 'confirmed') {
        return { success: false, error: '공지사항을 조회할 권한이 없습니다.' };
      }
    }

    // 공지사항 목록 조회 (최신순)
    const { data: rows, error: noticeError } = await supabase
      .from('event_notices')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (noticeError) {
      console.error('[notice] getEventNotices 공지사항 조회 실패:', noticeError.message);
      return { success: false, error: '공지사항 목록 조회에 실패했습니다.' };
    }

    const notices = mapDbNoticesToNotices(rows ?? []);
    return { success: true, data: notices };
  } catch (err) {
    console.error('[notice] getEventNotices 예외 발생:', err);
    return { success: false, error: '공지사항 목록 조회 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 공지사항 생성
// ============================================================

/**
 * 이벤트 공지사항 생성 (주최자만)
 *
 * content의 유효성을 검증한 후 event_notices 테이블에 INSERT합니다.
 * 성공 시 관리 페이지 캐시를 무효화합니다.
 *
 * @param eventId - 공지사항을 등록할 이벤트 UUID
 * @param content - 공지사항 내용 (1~1000글자)
 * @returns ActionResult<Notice>
 */
export async function createNotice(
  eventId: string,
  content: string
): Promise<ActionResult<Notice>> {
  try {
    // 주최자 권한 확인 (미인증 또는 비주최자 시 throw)
    const userId = await requireEventHost(eventId);

    // content 유효성 검증: 빈 문자열/공백 체크
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return { success: false, error: '공지사항 내용을 입력해주세요.' };
    }

    // 길이 제한: 1~1000글자
    if (trimmedContent.length > 1000) {
      return { success: false, error: '공지사항은 1000글자 이하여야 합니다.' };
    }

    const supabase = await createClient();

    // event_notices INSERT
    const { data: row, error: insertError } = await supabase
      .from('event_notices')
      .insert({
        event_id: eventId,
        author_id: userId,
        content: trimmedContent,
      })
      .select()
      .single();

    if (insertError || !row) {
      console.error('[notice] createNotice INSERT 실패:', insertError?.message);
      return { success: false, error: '공지사항 등록에 실패했습니다.' };
    }

    // 관리 페이지 캐시 무효화
    revalidatePath(`/protected/events/${eventId}/manage`, 'page');

    const notice = mapDbNoticeToNotice(row);
    return { success: true, data: notice };
  } catch (err) {
    // requireEventHost에서 throw한 권한/이벤트 에러 처리
    if (err instanceof Error) {
      console.error('[notice] createNotice 권한 오류:', err.message);
      return { success: false, error: err.message };
    }
    console.error('[notice] createNotice 예외 발생:', err);
    return { success: false, error: '공지사항 등록 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 공지사항 삭제
// ============================================================

/**
 * 이벤트 공지사항 삭제 (주최자만)
 *
 * 해당 이벤트에 속한 공지사항을 삭제합니다.
 * event_id 조건을 함께 적용하여 타 이벤트의 공지사항을 삭제하지 못하도록 방지합니다.
 * 성공 시 관리 페이지 캐시를 무효화합니다.
 *
 * @param eventId - 이벤트 UUID
 * @param noticeId - 삭제할 공지사항 UUID
 * @returns ActionResult
 */
export async function deleteNotice(eventId: string, noticeId: string): Promise<ActionResult> {
  try {
    // 주최자 권한 확인 (미인증 또는 비주최자 시 throw)
    await requireEventHost(eventId);

    const supabase = await createClient();

    // event_id + id 조건으로 삭제 (다른 이벤트의 공지 삭제 방지)
    const { error: deleteError, count } = await supabase
      .from('event_notices')
      .delete({ count: 'exact' })
      .eq('id', noticeId)
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('[notice] deleteNotice DELETE 실패:', deleteError.message);
      return { success: false, error: '공지사항 삭제에 실패했습니다.' };
    }

    // 실제로 삭제된 행이 없는 경우 (noticeId가 해당 이벤트에 존재하지 않음)
    if (count === 0) {
      console.error('[notice] deleteNotice 삭제 대상 없음: noticeId=', noticeId);
      return { success: false, error: '공지사항 삭제에 실패했습니다.' };
    }

    // 관리 페이지 캐시 무효화
    revalidatePath(`/protected/events/${eventId}/manage`, 'page');

    return { success: true, data: undefined };
  } catch (err) {
    // requireEventHost에서 throw한 권한/이벤트 에러 처리
    if (err instanceof Error) {
      console.error('[notice] deleteNotice 권한 오류:', err.message);
      return { success: false, error: err.message };
    }
    console.error('[notice] deleteNotice 예외 발생:', err);
    return { success: false, error: '공지사항 삭제 중 오류가 발생했습니다.' };
  }
}
