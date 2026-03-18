import {
  Event,
  EventWithStats,
  User,
  Participant,
  ParticipantStatus,
  Notice,
  ParticipatingEvent,
} from '@/lib/types';

// 사용자 데이터
export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'host@example.com',
    name: '이벤트 호스트',
  },
  {
    id: 'user-002',
    email: 'current@example.com',
    name: '현재 사용자',
  },
  {
    id: 'user-003',
    email: 'participant@example.com',
    name: '일반 참가자',
  },
];

// 이벤트 데이터
export const mockEvents: Event[] = [
  {
    id: 'event-001',
    hostId: 'user-001',
    title: '봄 독서 모임',
    description: '올봄에 읽을 추천 도서를 함께 공유하고 토론하는 모임입니다.',
    eventDate: '2026-04-15T19:00:00Z',
    location: '서울시 강남구 카페 북스',
    maxCapacity: 10,
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'event-002',
    hostId: 'user-001',
    title: '주말 보드게임',
    description: '다양한 보드게임을 함께 즐기는 모임입니다.',
    eventDate: '2026-03-22T14:00:00Z',
    location: '서울시 종로구 보드게임 카페',
    maxCapacity: 6,
    status: 'active',
    createdAt: '2026-03-05T14:30:00Z',
    updatedAt: '2026-03-05T14:30:00Z',
  },
  {
    id: 'event-003',
    hostId: 'user-001',
    title: '여름 등산 모임',
    description: '한여름 산악 등산을 함께하는 모임입니다. 초보자도 환영합니다.',
    eventDate: '2026-07-10T06:00:00Z',
    location: '북한산 등산로',
    maxCapacity: 20,
    status: 'active',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'event-004',
    hostId: 'user-001',
    title: '겨울 요리 클래스',
    description: '겨울 제철 음식을 함께 요리해 먹는 클래스입니다.',
    eventDate: '2026-12-20T18:00:00Z',
    location: '서울시 마포구 요리 스튜디오',
    maxCapacity: 8,
    status: 'cancelled',
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-03-18T16:00:00Z',
  },
  {
    id: 'event-005',
    hostId: 'user-001',
    title: '신년 영화 감상',
    description: '2025년 개봉한 명작 영화들을 함께 감상하는 모임입니다.',
    eventDate: '2026-01-15T19:30:00Z',
    location: '서울시 강남구 영화관',
    maxCapacity: 15,
    status: 'completed',
    createdAt: '2025-12-10T10:00:00Z',
    updatedAt: '2026-01-20T20:00:00Z',
  },
];

// 참가자 데이터
export const mockParticipants: Participant[] = [
  // event-001 (봄 독서 모임)
  { id: 'p-001', eventId: 'event-001', userId: 'user-001', status: 'confirmed', appliedAt: '2026-03-01T10:05:00Z', orderNumber: 1 },
  { id: 'p-002', eventId: 'event-001', userId: 'user-002', status: 'confirmed', appliedAt: '2026-03-02T14:00:00Z', orderNumber: 2 },
  { id: 'p-003', eventId: 'event-001', userId: 'user-003', status: 'confirmed', appliedAt: '2026-03-03T09:30:00Z', orderNumber: 3 },
  { id: 'p-004', eventId: 'event-001', userId: 'user-004', status: 'confirmed', appliedAt: '2026-03-04T16:20:00Z', orderNumber: 4 },
  { id: 'p-005', eventId: 'event-001', userId: 'user-005', status: 'confirmed', appliedAt: '2026-03-05T11:00:00Z', orderNumber: 5 },
  { id: 'p-006', eventId: 'event-001', userId: 'user-006', status: 'confirmed', appliedAt: '2026-03-06T13:15:00Z', orderNumber: 6 },
  { id: 'p-007', eventId: 'event-001', userId: 'user-007', status: 'confirmed', appliedAt: '2026-03-07T10:45:00Z', orderNumber: 7 },
  { id: 'p-008', eventId: 'event-001', userId: 'user-008', status: 'confirmed', appliedAt: '2026-03-08T15:30:00Z', orderNumber: 8 },
  { id: 'p-009', eventId: 'event-001', userId: 'user-009', status: 'waitlist', appliedAt: '2026-03-09T12:00:00Z', orderNumber: 1 },
  { id: 'p-010', eventId: 'event-001', userId: 'user-010', status: 'waitlist', appliedAt: '2026-03-10T08:30:00Z', orderNumber: 2 },

  // event-002 (주말 보드게임)
  { id: 'p-011', eventId: 'event-002', userId: 'user-001', status: 'confirmed', appliedAt: '2026-03-05T14:35:00Z', orderNumber: 1 },
  { id: 'p-012', eventId: 'event-002', userId: 'user-002', status: 'confirmed', appliedAt: '2026-03-06T10:00:00Z', orderNumber: 2 },
  { id: 'p-013', eventId: 'event-002', userId: 'user-011', status: 'confirmed', appliedAt: '2026-03-07T14:00:00Z', orderNumber: 3 },

  // event-003 (여름 등산 모임)
  { id: 'p-014', eventId: 'event-003', userId: 'user-001', status: 'confirmed', appliedAt: '2026-03-10T09:05:00Z', orderNumber: 1 },
  { id: 'p-015', eventId: 'event-003', userId: 'user-002', status: 'confirmed', appliedAt: '2026-03-11T11:30:00Z', orderNumber: 2 },
  { id: 'p-016', eventId: 'event-003', userId: 'user-012', status: 'confirmed', appliedAt: '2026-03-12T09:00:00Z', orderNumber: 3 },
  { id: 'p-017', eventId: 'event-003', userId: 'user-013', status: 'confirmed', appliedAt: '2026-03-13T15:20:00Z', orderNumber: 4 },
  { id: 'p-018', eventId: 'event-003', userId: 'user-014', status: 'confirmed', appliedAt: '2026-03-14T10:15:00Z', orderNumber: 5 },
  { id: 'p-019', eventId: 'event-003', userId: 'user-015', status: 'confirmed', appliedAt: '2026-03-15T13:45:00Z', orderNumber: 6 },
  { id: 'p-020', eventId: 'event-003', userId: 'user-016', status: 'confirmed', appliedAt: '2026-03-16T11:00:00Z', orderNumber: 7 },
  { id: 'p-021', eventId: 'event-003', userId: 'user-017', status: 'confirmed', appliedAt: '2026-03-17T14:30:00Z', orderNumber: 8 },
  { id: 'p-022', eventId: 'event-003', userId: 'user-018', status: 'confirmed', appliedAt: '2026-03-18T09:20:00Z', orderNumber: 9 },
  { id: 'p-023', eventId: 'event-003', userId: 'user-019', status: 'confirmed', appliedAt: '2026-03-19T12:10:00Z', orderNumber: 10 },
  { id: 'p-024', eventId: 'event-003', userId: 'user-020', status: 'confirmed', appliedAt: '2026-03-01T16:40:00Z', orderNumber: 11 },
  { id: 'p-025', eventId: 'event-003', userId: 'user-021', status: 'confirmed', appliedAt: '2026-03-02T10:25:00Z', orderNumber: 12 },
  { id: 'p-026', eventId: 'event-003', userId: 'user-022', status: 'confirmed', appliedAt: '2026-03-03T13:50:00Z', orderNumber: 13 },
  { id: 'p-027', eventId: 'event-003', userId: 'user-023', status: 'confirmed', appliedAt: '2026-03-04T11:30:00Z', orderNumber: 14 },
  { id: 'p-028', eventId: 'event-003', userId: 'user-024', status: 'confirmed', appliedAt: '2026-03-05T15:00:00Z', orderNumber: 15 },
  { id: 'p-029', eventId: 'event-003', userId: 'user-025', status: 'confirmed', appliedAt: '2026-03-06T09:15:00Z', orderNumber: 16 },
  { id: 'p-030', eventId: 'event-003', userId: 'user-026', status: 'confirmed', appliedAt: '2026-03-07T12:45:00Z', orderNumber: 17 },
  { id: 'p-031', eventId: 'event-003', userId: 'user-027', status: 'confirmed', appliedAt: '2026-03-08T10:35:00Z', orderNumber: 18 },
  { id: 'p-032', eventId: 'event-003', userId: 'user-028', status: 'confirmed', appliedAt: '2026-03-09T14:20:00Z', orderNumber: 19 },
  { id: 'p-033', eventId: 'event-003', userId: 'user-029', status: 'confirmed', appliedAt: '2026-03-10T11:10:00Z', orderNumber: 20 },
  { id: 'p-034', eventId: 'event-003', userId: 'user-030', status: 'waitlist', appliedAt: '2026-03-11T13:30:00Z', orderNumber: 1 },
  { id: 'p-035', eventId: 'event-003', userId: 'user-031', status: 'waitlist', appliedAt: '2026-03-12T10:00:00Z', orderNumber: 2 },
  { id: 'p-036', eventId: 'event-003', userId: 'user-032', status: 'waitlist', appliedAt: '2026-03-13T15:15:00Z', orderNumber: 3 },
  { id: 'p-037', eventId: 'event-003', userId: 'user-033', status: 'waitlist', appliedAt: '2026-03-14T12:40:00Z', orderNumber: 4 },
  { id: 'p-038', eventId: 'event-003', userId: 'user-034', status: 'waitlist', appliedAt: '2026-03-15T09:50:00Z', orderNumber: 5 },

  // event-005 (신년 영화 감상) - completed
  { id: 'p-039', eventId: 'event-005', userId: 'user-001', status: 'confirmed', appliedAt: '2025-12-10T10:05:00Z', orderNumber: 1 },
  { id: 'p-040', eventId: 'event-005', userId: 'user-002', status: 'confirmed', appliedAt: '2025-12-12T14:00:00Z', orderNumber: 2 },
  { id: 'p-041', eventId: 'event-005', userId: 'user-035', status: 'confirmed', appliedAt: '2025-12-15T11:30:00Z', orderNumber: 3 },
  { id: 'p-042', eventId: 'event-005', userId: 'user-036', status: 'confirmed', appliedAt: '2025-12-18T09:00:00Z', orderNumber: 4 },
  { id: 'p-043', eventId: 'event-005', userId: 'user-037', status: 'confirmed', appliedAt: '2025-12-20T16:15:00Z', orderNumber: 5 },
  { id: 'p-044', eventId: 'event-005', userId: 'user-038', status: 'confirmed', appliedAt: '2025-12-22T13:45:00Z', orderNumber: 6 },
  { id: 'p-045', eventId: 'event-005', userId: 'user-039', status: 'confirmed', appliedAt: '2025-12-25T10:20:00Z', orderNumber: 7 },
  { id: 'p-046', eventId: 'event-005', userId: 'user-040', status: 'confirmed', appliedAt: '2025-12-28T15:30:00Z', orderNumber: 8 },
  { id: 'p-047', eventId: 'event-005', userId: 'user-041', status: 'confirmed', appliedAt: '2026-01-01T12:00:00Z', orderNumber: 9 },
  { id: 'p-048', eventId: 'event-005', userId: 'user-042', status: 'confirmed', appliedAt: '2026-01-03T14:15:00Z', orderNumber: 10 },
  { id: 'p-049', eventId: 'event-005', userId: 'user-043', status: 'confirmed', appliedAt: '2026-01-05T11:40:00Z', orderNumber: 11 },
  { id: 'p-050', eventId: 'event-005', userId: 'user-044', status: 'confirmed', appliedAt: '2026-01-08T09:25:00Z', orderNumber: 12 },
  { id: 'p-051', eventId: 'event-005', userId: 'user-045', status: 'confirmed', appliedAt: '2026-01-10T13:50:00Z', orderNumber: 13 },
  { id: 'p-052', eventId: 'event-005', userId: 'user-046', status: 'confirmed', appliedAt: '2026-01-12T10:30:00Z', orderNumber: 14 },
  { id: 'p-053', eventId: 'event-005', userId: 'user-047', status: 'confirmed', appliedAt: '2026-01-13T15:05:00Z', orderNumber: 15 },
];

// 공지사항 데이터
export const mockNotices: Notice[] = [
  {
    id: 'notice-001',
    eventId: 'event-001',
    authorId: 'user-001',
    content: '안녕하세요! 4월 15일 봄 독서 모임을 진행할 예정입니다. 이번 달 추천 도서는 "독서의 즐거움"입니다. 미리 읽어주시면 좋겠습니다.',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
  },
  {
    id: 'notice-002',
    eventId: 'event-001',
    authorId: 'user-001',
    content: '모임 일정이 확정되었습니다. 4월 15일 오후 7시에 강남역 카페에서 만나요! 주차는 건물 지하주차장을 이용하시면 됩니다.',
    createdAt: '2026-03-15T10:30:00Z',
    updatedAt: '2026-03-15T10:30:00Z',
  },
  {
    id: 'notice-003',
    eventId: 'event-003',
    authorId: 'user-001',
    content: '여름 등산 모임을 진행합니다. 초보자도 충분히 참여할 수 있는 난이도이며, 안전 가이드를 드릴 예정입니다. 편한 복장과 등산화를 준비해주세요.',
    createdAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
];

// 유틸리티 함수: 이벤트 ID로 참가자 조회
export function getParticipantsByEventId(eventId: string): Participant[] {
  return mockParticipants.filter((p) => p.eventId === eventId);
}

// 유틸리티 함수: 이벤트 ID로 공지사항 조회
export function getNoticesByEventId(eventId: string): Notice[] {
  return mockNotices.filter((n) => n.eventId === eventId);
}

// 유틸리티 함수: 참가 상태 조회
export function getMyParticipationStatus(eventId: string, userId: string): ParticipantStatus | null {
  const participant = mockParticipants.find((p) => p.eventId === eventId && p.userId === userId);
  return participant?.status ?? null;
}

// 유틸리티 함수: 사용자가 주최하는 이벤트 조회
export function getHostedEvents(userId: string): EventWithStats[] {
  return mockEvents
    .filter((e) => e.hostId === userId)
    .map((event) => {
      const participants = getParticipantsByEventId(event.id);
      const confirmedCount = participants.filter((p) => p.status === 'confirmed').length;
      const waitlistCount = participants.filter((p) => p.status === 'waitlist').length;
      const host = mockUsers.find((u) => u.id === event.hostId)!;

      return {
        ...event,
        confirmedCount,
        waitlistCount,
        host,
      };
    });
}

// 유틸리티 함수: 사용자가 참가하는 이벤트 조회
export function getParticipatingEvents(userId: string): ParticipatingEvent[] {
  const participationMap = new Map<string, ParticipantStatus>();

  mockParticipants
    .filter((p) => p.userId === userId)
    .forEach((p) => {
      participationMap.set(p.eventId, p.status);
    });

  return mockEvents
    .filter((e) => participationMap.has(e.id))
    .map((event) => ({
      ...event,
      participantStatus: participationMap.get(event.id)!,
    }));
}

// 유틸리티 함수: EventWithStats 데이터 생성 (이벤트 상세 조회 시 사용)
export function getEventWithStats(eventId: string): EventWithStats | null {
  const event = mockEvents.find((e) => e.id === eventId);
  if (!event) return null;

  const participants = getParticipantsByEventId(eventId);
  const confirmedCount = participants.filter((p) => p.status === 'confirmed').length;
  const waitlistCount = participants.filter((p) => p.status === 'waitlist').length;
  const host = mockUsers.find((u) => u.id === event.hostId)!;

  return {
    ...event,
    confirmedCount,
    waitlistCount,
    host,
  };
}
