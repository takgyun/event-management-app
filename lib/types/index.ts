// 이벤트 상태 타입
export type EventStatus = 'active' | 'cancelled' | 'completed';

// 참가 상태 타입
export type ParticipantStatus = 'confirmed' | 'waitlist' | 'cancelled';

// 사용자 정보
export interface User {
  id: string;
  email: string;
  name: string | null;
}

// 이벤트 기본 정보
export interface Event {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  eventDate: string; // ISO 8601 형식
  location: string;
  maxCapacity: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

// 이벤트 생성 입력
export interface CreateEventInput {
  title: string;
  description?: string;
  eventDate: string;
  location: string;
  maxCapacity: number;
}

// 이벤트 수정 입력
export type UpdateEventInput = Partial<CreateEventInput> & {
  status?: EventStatus;
};

// 인증 세션
export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: number;
}

// 참가자 정보
export interface Participant {
  id: string;
  eventId: string;
  userId: string;
  status: ParticipantStatus;
  appliedAt: string;
  orderNumber: number;
}

// 공지사항
export interface Notice {
  id: string;
  eventId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 이벤트 상세 (통계 포함)
export type EventWithStats = Event & {
  confirmedCount: number;
  waitlistCount: number;
  host: User;
};

// 참가 이벤트 (대시보드용)
export type ParticipatingEvent = Event & {
  participantStatus: ParticipantStatus;
};
