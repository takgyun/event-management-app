import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EventsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">이벤트 목록</h1>
          <p className="text-muted-foreground mt-2">
            (더미 데이터는 Phase 2에서 추가 예정)
          </p>
        </div>

        <Button asChild>
          <Link href="/protected/events/new">이벤트 만들기</Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 이벤트 카드 플레이스홀더 */}
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            이벤트 카드 플레이스홀더
          </div>
        </div>
      </div>
    </div>
  );
}
