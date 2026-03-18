import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl space-y-8 sm:space-y-12">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            대시보드
          </h1>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/protected/events/new">새 이벤트 만들기</Link>
          </Button>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">내 이벤트</h2>
          <div className="border rounded-lg p-4 sm:p-6 text-center text-muted-foreground">
            주최 중인 이벤트 카드 플레이스홀더
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">참가 이벤트</h2>
          <div className="border rounded-lg p-4 sm:p-6 text-center text-muted-foreground">
            참가 중인 이벤트 카드 플레이스홀더
          </div>
        </section>
      </div>
    </div>
  );
}
