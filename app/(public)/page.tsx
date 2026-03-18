import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold">모임 이벤트 관리</h1>
        <p className="text-xl text-muted-foreground">
          소규모 모임 및 커뮤니티 이벤트를 쉽게 관리하세요
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Button asChild className="w-full">
            <Link href="/events">이벤트 보기</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/protected/events/new">이벤트 만들기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
