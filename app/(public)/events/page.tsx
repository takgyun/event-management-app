import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EventsPage() {
  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">이벤트 목록</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            (더미 데이터는 Phase 2에서 추가 예정)
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/protected/events/new">이벤트 만들기</Link>
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 이벤트 카드 플레이스홀더 */}
          <div className="border rounded-lg p-4 sm:p-6 text-center text-muted-foreground">
            이벤트 카드 플레이스홀더
          </div>
        </div>
      </div>
    </div>
  );
}
