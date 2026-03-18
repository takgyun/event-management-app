import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">대시보드</h1>
          <Button asChild>
            <Link href="/protected/events/new">새 이벤트 만들기</Link>
          </Button>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">내 이벤트</h2>
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            주최 중인 이벤트 카드 플레이스홀더
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">참가 이벤트</h2>
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            참가 중인 이벤트 카드 플레이스홀더
          </div>
        </section>
      </div>
    </div>
  );
}
