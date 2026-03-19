import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from '@/components/events/event-card';
import { getHostedEvents, getParticipatingEvents, getEventWithStats } from '@/lib/data/mock-data';

// TODO: 현재는 더미 데이터 단계이므로 userId 하드코딩
// 추후 auth 시스템 통합 시 세션에서 userId 조회
const CURRENT_USER_ID = 'user-001';
const PARTICIPANT_USER_ID = 'user-002';

export default function DashboardPage() {
  const hostedEvents = getHostedEvents(CURRENT_USER_ID);
  const participatingEventsData = getParticipatingEvents(PARTICIPANT_USER_ID);

  // ParticipatingEvent를 EventWithStats로 변환하면서 participantStatus 유지
  const participatingEventsWithStats = participatingEventsData
    .map(pEvent => {
      const eventWithStats = getEventWithStats(pEvent.id);
      if (!eventWithStats) return null;
      return { eventWithStats, participantStatus: pEvent.participantStatus };
    })
    .filter((item) => item !== null);

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
          {hostedEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {hostedEvents.map(event => (
                <EventCard key={event.id} event={event} variant="host" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="아직 주최한 이벤트가 없습니다"
              description="새로운 이벤트를 만들어보세요."
            />
          )}
        </section>

        {/* 참가 중인 이벤트 */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">참가 중인 이벤트</h2>
          {participatingEventsWithStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {participatingEventsWithStats.map(({ eventWithStats, participantStatus }) => (
                <EventCard
                  key={eventWithStats.id}
                  event={eventWithStats}
                  variant="participant"
                  participantStatus={participantStatus}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="참가 중인 이벤트가 없습니다"
              description="이벤트 목록에서 참가할 이벤트를 찾아보세요."
            />
          )}
        </section>
      </div>
    </div>
  );
}
