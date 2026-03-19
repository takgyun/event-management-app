import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from '@/components/events/event-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMyHostedEvents } from '@/lib/actions/event';
import { getMyParticipatingEvents } from '@/lib/actions/participant';

export default async function DashboardPage() {
  // 내가 주최한 이벤트 조회
  const hostedResult = await getMyHostedEvents();

  // 내가 참가 중인 이벤트 조회
  const participatingResult = await getMyParticipatingEvents();

  const hostedEvents = hostedResult.success ? (hostedResult.data ?? []) : [];
  const participatingEvents = participatingResult.success
    ? (participatingResult.data ?? [])
    : [];

  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl space-y-8 sm:space-y-12">
        {/* 헤더 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">대시보드</h1>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/protected/events/new">새 이벤트 만들기</Link>
          </Button>
        </div>

        {/* 주최 중인 이벤트 */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">내가 주최하는 이벤트</h2>

          {/* 조회 실패 시 에러 메시지 */}
          {!hostedResult.success && (
            <Alert variant="destructive">
              <AlertDescription>{hostedResult.error}</AlertDescription>
            </Alert>
          )}

          {hostedEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {hostedEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="host" />
              ))}
            </div>
          ) : (
            hostedResult.success && (
              <EmptyState
                title="아직 주최한 이벤트가 없습니다"
                description="새로운 이벤트를 만들어보세요."
              />
            )
          )}
        </section>

        {/* 참가 중인 이벤트 */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">참가 중인 이벤트</h2>

          {/* 조회 실패 시 에러 메시지 */}
          {!participatingResult.success && (
            <Alert variant="destructive">
              <AlertDescription>{participatingResult.error}</AlertDescription>
            </Alert>
          )}

          {participatingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {participatingEvents.map((pEvent) => {
                // ParticipatingEvent를 EventCard가 요구하는 EventWithStats 형태로 변환
                // EventCard의 host 필드는 참가자 뷰에서 표시되지 않으므로 빈 값으로 처리
                const eventWithStats = {
                  ...pEvent,
                  confirmedCount: 0, // 참가자 뷰에서는 미표시
                  waitlistCount: 0,
                  host: { id: pEvent.hostId, email: '', name: null },
                };
                return (
                  <EventCard
                    key={pEvent.id}
                    event={eventWithStats}
                    variant="participant"
                    participantStatus={pEvent.participantStatus}
                  />
                );
              })}
            </div>
          ) : (
            participatingResult.success && (
              <EmptyState
                title="참가 중인 이벤트가 없습니다"
                description="이벤트 목록에서 참가할 이벤트를 찾아보세요."
              />
            )
          )}
        </section>
      </div>
    </div>
  );
}
