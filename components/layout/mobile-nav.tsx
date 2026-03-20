'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="메뉴 열기">
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>모임 이벤트</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-4">
            <Link
              href="/events"
              className="text-foreground/70 hover:text-foreground text-sm transition-colors"
              onClick={() => setOpen(false)}
            >
              이벤트 목록
            </Link>
            <Link
              href="/protected/dashboard"
              className="text-foreground/70 hover:text-foreground text-sm transition-colors"
              onClick={() => setOpen(false)}
            >
              대시보드
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
