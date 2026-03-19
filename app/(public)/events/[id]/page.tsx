import { Suspense } from 'react';
import { EventDetailContent } from '@/components/events/event-detail-content';

/**
 * 이벤트 상세 페이지
 *
 * cacheComponents: true 환경에서 cookies() 접근은 Suspense 내부에서만 허용됩니다.
 * 실제 데이터 페칭 로직을 Suspense로 감싸서 동적 렌더링 처리합니다.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15: params는 Promise로 처리
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-4xl space-y-8 animate-pulse">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="space-y-4">
              <div className="h-10 w-2/3 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-40 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <EventDetailContent eventId={id} />
    </Suspense>
  );
}
