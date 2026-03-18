# P1-1: 프로젝트 기초 설정 및 타입 정의

## P1-1.1 개발 환경 현황 ✅ (완료)

이미 구성된 개발 환경:
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **shadcn/ui** (new-york 스타일, Radix UI 기반)
- **ESLint**
- **next-themes** (다크 모드 지원)
- **Supabase** (@supabase/ssr, @supabase/supabase-js)

## P1-1.3 TypeScript 타입 정의

**파일:** `lib/types/index.ts`

### 1. EventStatus
```typescript
type EventStatus = 'active' | 'cancelled' | 'completed'
```

### 2. Event 인터페이스
```typescript
interface Event {
  id: string
  hostId: string
  title: string
  description: string | null
  eventDate: string           // ISO 8601 형식
  location: string
  maxCapacity: number
  status: EventStatus
  createdAt: string
  updatedAt: string
}
```

### 3. CreateEventInput
```typescript
interface CreateEventInput {
  title: string
  description?: string
  eventDate: string
  location: string
  maxCapacity: number
}
```

### 4. UpdateEventInput
```typescript
type UpdateEventInput = Partial<CreateEventInput> & {
  status?: EventStatus
}
```

### 5. User
```typescript
interface User {
  id: string
  email: string
  name: string | null
}
```

### 6. AuthSession
```typescript
interface AuthSession {
  user: User
  accessToken: string
  expiresAt: number
}
```

### 7. ParticipantStatus
```typescript
type ParticipantStatus = 'confirmed' | 'waitlist' | 'cancelled'
```

### 8. Participant
```typescript
interface Participant {
  id: string
  eventId: string
  userId: string
  status: ParticipantStatus
  appliedAt: string
  orderNumber: number
}
```

### 9. Notice
```typescript
interface Notice {
  id: string
  eventId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
}
```

### 10. EventWithStats (상세 페이지용)
```typescript
type EventWithStats = Event & {
  confirmedCount: number
  waitlistCount: number
  host: User
}
```

### 11. ParticipatingEvent (대시보드용)
```typescript
type ParticipatingEvent = Event & {
  participantStatus: ParticipantStatus
}
```

## 타입 정의 분리 원칙

- **`lib/types/index.ts`** — 애플리케이션 도메인 타입 (Event, User, Participant 등)
- **`lib/supabase/types.ts`** — Supabase 데이터베이스 스키마 타입 (자동 생성 예정)

이 두 가지를 분리함으로써 도메인 로직과 DB 스키마를 독립적으로 유지합니다.

## 주의 사항

- 모든 타입은 **camelCase**로 정의 (JavaScript 관례)
- ISO 8601 형식의 날짜는 `string` 타입으로 통일
- `null` 허용이 필요한 필드는 명시적으로 `| null` 추가
- Supabase 자동 생성 타입(`lib/supabase/types.ts`)과의 매핑은 Server Actions에서 처리
