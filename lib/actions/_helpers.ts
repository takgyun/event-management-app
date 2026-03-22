'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * 인증된 사용자 ID 반환
 *
 * 현재 세션의 사용자 ID를 반환합니다.
 * 미인증 상태이면 로그인 페이지로 리다이렉트합니다.
 *
 * @returns 인증된 사용자 UUID
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return user.id;
}

/**
 * 이벤트 주최자 확인
 *
 * 현재 사용자가 해당 이벤트의 주최자인지 확인합니다.
 * 미인증 또는 비주최자인 경우 Error를 throw합니다.
 *
 * @param eventId - 확인할 이벤트 UUID
 * @returns 인증된 사용자 UUID
 * @throws Error - 권한 없음 또는 이벤트 없음
 */
export async function requireEventHost(eventId: string): Promise<string> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    throw new Error('이벤트를 찾을 수 없습니다.');
  }

  if (event.host_id !== userId) {
    throw new Error('이벤트 주최자만 이 작업을 수행할 수 있습니다.');
  }

  return userId;
}

/**
 * 확정된 참가자 확인
 *
 * 현재 사용자가 해당 이벤트의 confirmed 상태 참가자인지 확인합니다.
 * 미인증 또는 미확인 참가자인 경우 Error를 throw합니다.
 *
 * @param eventId - 확인할 이벤트 UUID
 * @returns 인증된 사용자 UUID
 * @throws Error - 권한 없음 또는 참가자 아님
 */
export async function requireConfirmedParticipant(eventId: string): Promise<string> {
  const userId = await requireAuth();
  const supabase = await createClient();

  const { data: participant, error } = await supabase
    .from('event_participants')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error || !participant) {
    throw new Error('해당 이벤트의 참가자가 아닙니다.');
  }

  if (participant.status !== 'confirmed') {
    throw new Error('확정된 참가자만 이 작업을 수행할 수 있습니다.');
  }

  return userId;
}
