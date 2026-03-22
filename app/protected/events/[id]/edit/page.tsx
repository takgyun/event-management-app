export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EventForm } from '@/components/events/event-form';
import { getEventById } from '@/lib/actions/event';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params는 Promise로 처리
  const { id } = await params;

  // 기존 이벤트 데이터 조회
  const result = await getEventById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const event = result.data;

  return (
    <div className="flex w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        <Link href="/protected/dashboard" className="text-sm text-blue-500 hover:underline">
          ← 돌아가기
        </Link>

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">이벤트 수정</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{event.title}</p>
        </div>

        {/* 취소된 이벤트는 수정 불가 */}
        {event.status === 'cancelled' ? (
          <Alert variant="destructive">
            <AlertDescription>취소된 이벤트는 수정할 수 없습니다.</AlertDescription>
          </Alert>
        ) : (
          <EventForm mode="edit" event={event} />
        )}
      </div>
    </div>
  );
}
