import { Suspense } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventsListContent } from '@/components/events/events-list-content';

/**
 * 이벤트 목록 페이지
 *
 * cacheComponents: true 환경에서 cookies() 접근은 Suspense 내부에서만 허용됩니다.
 * 헤더/버튼 등 정적 콘텐츠는 바깥에 두고, 데이터 페칭은 Suspense로 감쌉니다.
 */
import { EventsListContent } from '@/components/events/events-list-content';

/**
 * 이벤트 목록 페이지
 *
 * cacheComponents: true 환경에서 cookies() 접근은 Suspense 내부에서만 허용됩니다.
 * 헤더/버튼 등 정적 콘텐츠는 바깥에 두고, 데이터 페칭은 Suspense로 감쌉니다.
 */
export default function EventsPage() {
  return (
    <div className="flex w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full max-w-6xl space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">이벤트 목록</h1>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/protected/events/new">이벤트 만들기</Link>
          </Button>
        </div>

        {/* 필터 탭 및 이벤트 목록: 데이터 페칭이 있으므로 Suspense로 감쌈 */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted h-64 animate-pulse rounded-lg" />
              ))}
            </div>
          }
        >
          <EventsListContent />
        </Suspense>
      </div>
    </div>
  );
}
