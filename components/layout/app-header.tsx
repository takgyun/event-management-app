import { AuthButton } from '@/components/auth-button';
import { EnvVarWarning } from '@/components/env-var-warning';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { hasEnvVars } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-b-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl flex items-center justify-between">
          {/* 로고 및 앱 이름 */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-base sm:text-lg shrink-0"
          >
            <span className="hidden sm:inline">모임 이벤트</span>
            <span className="sm:hidden">모임</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6 mx-auto">
            <Link
              href="/events"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              이벤트 목록
            </Link>
            <Link
              href="/protected/dashboard"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              대시보드
            </Link>
          </nav>

          {/* 인증 버튼 및 테마 */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense fallback={<div className="w-12 h-6" />}>
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
