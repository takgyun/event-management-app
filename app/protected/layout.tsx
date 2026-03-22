import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';

/**
 * 보호된 라우트 레이아웃
 *
 * 모든 /protected/* 경로에 대해 인증을 강제합니다.
 * 미인증 사용자는 즉시 /auth/login으로 리다이렉트됩니다.
 *
 * Suspense + AuthCheck 패턴 대신 async 레이아웃 방식을 사용하여
 * 인증 확인이 렌더링 이전에 동기적으로 처리되도록 합니다.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 서버에서 현재 사용자 인증 확인

  // 서버에서 현재 사용자 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미인증 사용자는 로그인 페이지로 즉시 리다이렉트
  // 미인증 사용자는 로그인 페이지로 즉시 리다이렉트
  if (!user) {
    redirect('/auth/login');
  }

  // 인증된 사용자에게만 보호된 콘텐츠 렌더링
  // 인증된 사용자에게만 보호된 콘텐츠 렌더링
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <AppHeader />
      <main className="w-full flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
