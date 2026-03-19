'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from '@/components/events/event-card';
import { mockEvents } from '@/lib/data/mock-data';
import { getEventWithStats } from '@/lib/data/mock-data';

type EventStatus = 'active' | 'completed' | 'cancelled';

export default function EventsPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | EventStatus>('all');

  // 이벤트 필터링
  const filteredEvents = selectedTab === 'all'
    ? mockEvents
    : mockEvents.filter(e => e.status === selectedTab);

  // EventWithStats 배열로 변환
  const eventsWithStats = filteredEvents
    .map(event => getEventWithStats(event.id))
    .filter((e) => e !== null);

  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">이벤트 목록</h1>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/protected/events/new">이벤트 만들기</Link>
          </Button>
        </div>

        {/* 필터 탭 */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'all' | EventStatus)}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="active">모집중</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
            <TabsTrigger value="cancelled">취소</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {eventsWithStats.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {eventsWithStats.map(event => (
                  <EventCard key={event.id} event={event} variant="list" />
                ))}
              </div>
            ) : (
              <EmptyState
                title="이벤트가 없습니다"
                description={`${selectedTab === 'all' ? '현재' : '선택한 상태의'} 이벤트가 없습니다.`}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
