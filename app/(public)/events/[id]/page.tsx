import { Suspense } from 'react';
import { EventDetailContent } from '@/components/events/event-detail-content';

/**
 * 이벤트 상세 페이지
 *
 * cacheComponents: true 환경에서 cookies() 접근은 Suspense 내부에서만 허용됩니다.
 * 실제 데이터 페칭 로직을 Suspense로 감싸서 동적 렌더링 처리합니다.
 */
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params는 Promise로 처리
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex w-full items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-4xl animate-pulse space-y-8">
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="space-y-4">
              <div className="bg-muted h-10 w-2/3 rounded" />
              <div className="bg-muted h-4 w-32 rounded" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-muted h-40 rounded-lg" />
              <div className="bg-muted h-40 rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <EventDetailContent eventId={id} />
    </Suspense>
  );
}
