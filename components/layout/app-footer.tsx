import { ThemeSwitcher } from '@/components/theme-switcher';

export function AppFooter() {
  return (
    <footer className="w-full border-t border-t-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-xs sm:text-sm text-foreground/60">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-semibold text-foreground text-sm">모임 이벤트</span>
            <span className="hidden sm:inline">© 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="sm:hidden">© 2026</span>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
