import { AuthButton } from '@/components/auth-button';
import { EnvVarWarning } from '@/components/env-var-warning';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { hasEnvVars } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';

export function AppHeader() {
  return (
    <header className="flex h-16 w-full items-center justify-center border-b border-b-foreground/10">
      <div className="flex w-full max-w-5xl items-center justify-between px-5 text-sm">
        {/* 로고 및 앱 이름 */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>모임 이벤트</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-6">
          <Link
            href="/events"
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            이벤트 목록
          </Link>
          <Link
            href="/protected/dashboard"
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            대시보드
          </Link>
        </nav>

        {/* 인증 버튼 및 테마 */}
        <div className="flex items-center gap-3">
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
    </header>
  );
}
