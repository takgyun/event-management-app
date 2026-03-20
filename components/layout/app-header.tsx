import { AuthButton } from '@/components/auth-button';
import { EnvVarWarning } from '@/components/env-var-warning';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { hasEnvVars } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';

export function AppHeader() {
  return (
    <header className="border-b-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-16 w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-6xl items-center justify-between">
          {/* 로고 및 앱 이름 */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-base font-semibold sm:text-lg"
          >
            <span className="hidden sm:inline">모임 이벤트</span>
            <span className="sm:hidden">모임</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="mx-auto hidden items-center gap-6 md:flex">
            <Link
              href="/events"
              className="text-foreground/70 hover:text-foreground text-sm transition-colors"
            >
              이벤트 목록
            </Link>
            <Link
              href="/protected/dashboard"
              className="text-foreground/70 hover:text-foreground text-sm transition-colors"
            >
              대시보드
            </Link>
          </nav>

          {/* 모바일 햄버거 메뉴 */}
          <MobileNav />

          {/* 인증 버튼 및 테마 */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense fallback={<div className="h-6 w-12" />}>
                <AuthButton />
              </Suspense>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
