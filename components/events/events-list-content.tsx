import { getEvents } from '@/lib/actions/event';
import { EventsFilterTabs } from '@/components/events/events-filter-tabs';

/**
 * 이벤트 목록 데이터 페칭 서버 컴포넌트
 *
 * Suspense 내부에서 렌더링되어 cookies() 동적 접근이 허용됩니다.
 */
export async function EventsListContent() {
  // 실제 Supabase에서 이벤트 목록 조회
  const events = await getEvents();

  return <EventsFilterTabs events={events} />;
}
