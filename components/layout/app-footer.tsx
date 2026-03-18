import { ThemeSwitcher } from '@/components/theme-switcher';

export function AppFooter() {
  return (
    <footer className="flex h-16 w-full items-center justify-center border-t border-t-foreground/10">
      <div className="flex w-full max-w-5xl items-center justify-between px-5 text-sm text-foreground/60">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">모임 이벤트</span>
          <span>© 2026</span>
        </div>
        <ThemeSwitcher />
      </div>
    </footer>
  );
}
