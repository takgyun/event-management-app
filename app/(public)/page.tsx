import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
      <div className="w-full max-w-6xl">
        <div className="text-center space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            모임 이벤트 관리
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            소규모 모임 및 커뮤니티 이벤트를 쉽게 관리하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-8 justify-center">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/events">이벤트 보기</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/protected/events/new">이벤트 만들기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
