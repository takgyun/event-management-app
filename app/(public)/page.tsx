import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: '이벤트 생성',
      description: '모임과 커뮤니티 이벤트를 쉽게 만들고 관리하세요',
    },
    {
      icon: Users,
      title: '참가자 관리',
      description: '참가자 목록을 실시간으로 확인하고 관리합니다',
    },
    {
      icon: BarChart3,
      title: '실시간 현황',
      description: '이벤트 통계와 참가 현황을 한눈에 파악하세요',
    },
  ];

  return (
    <div className="w-full">
      {/* 히어로 섹션 */}
      <section className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
        <div className="w-full max-w-6xl">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* 배지 */}
            <div className="inline-block">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground border-muted">
                모임 이벤트 플랫폼
              </span>
            </div>

            {/* 헤드라인 */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              모임 이벤트를 쉽게 관리하세요
            </h1>

            {/* 서브텍스트 */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              소규모 모임부터 커뮤니티 이벤트까지, 모든 것을 한 곳에서 관리하세요
            </p>

            {/* CTA 버튼 */}
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
      </section>

      {/* 기능 소개 섹션 */}
      <section className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 bg-muted/30">
        <div className="w-full max-w-6xl">
          <div className="space-y-12">
            {/* 섹션 제목 */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                주요 기능
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                필요한 모든 기능을 제공합니다
              </p>
            </div>

            {/* 기능 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex flex-col items-start p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mb-4 p-2 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
