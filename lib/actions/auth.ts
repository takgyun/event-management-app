'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/supabase/types';
import type { User } from '@supabase/supabase-js';

/**
 * 로그아웃 Server Action
 *
 * Supabase 세션을 종료하고 홈 페이지로 리다이렉트합니다.
 * 쿠키에 저장된 세션 토큰도 함께 삭제됩니다.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();

  // Supabase 세션 종료
  await supabase.auth.signOut();

  // 홈 페이지로 리다이렉트
  redirect('/');
}

/**
 * 현재 인증된 사용자 정보 조회
 *
 * Supabase auth.getUser()를 호출하여 현재 세션의 사용자를 반환합니다.
 * 미인증 상태이면 null을 반환합니다.
 *
 * @returns 현재 사용자 객체 또는 null
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 현재 사용자의 프로필 정보 조회
 *
 * auth.getUser()로 사용자 ID를 확인한 후 profiles 테이블에서
 * 해당 사용자의 프로필 데이터를 조회합니다.
 *
 * @returns 프로필 데이터 또는 null (미인증 또는 프로필 없음)
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  // 현재 인증된 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // profiles 테이블에서 사용자 프로필 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile;
}
