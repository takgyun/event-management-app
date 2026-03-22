'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from '@/components/events/event-card';
import type { EventWithStats, EventStatus } from '@/lib/types';

interface EventsFilterTabsProps {
  events: EventWithStats[];
}

export function EventsFilterTabs({ events }: EventsFilterTabsProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | EventStatus>('all');

  // 선택한 탭에 따라 이벤트 필터링
  const filteredEvents =
    selectedTab === 'all' ? events : events.filter((e) => e.status === selectedTab);

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as 'all' | EventStatus)}
    >
      <TabsList>
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="active">모집중</TabsTrigger>
        <TabsTrigger value="completed">완료</TabsTrigger>
        <TabsTrigger value="cancelled">취소</TabsTrigger>
      </TabsList>

      <TabsContent value={selectedTab} className="mt-6">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {filteredEvents.map((event) => (
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
  );
}
