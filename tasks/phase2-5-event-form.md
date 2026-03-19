# Phase 2-5: 이벤트 생성/수정 폼

## 목표

React Hook Form + Zod를 활용한 이벤트 생성/수정 폼 구현:
- 폼 유효성 검사 (필수 필드, 날짜 범위, 숫자 범위)
- 생성 및 수정 모드 지원
- 날짜/시간 입력 분리 처리 (eventDate = date + time 합산)

---

## Zod 스키마 정의

### `lib/validations/event.ts`

```typescript
import { z } from 'zod';

// 공통 스키마
const baseEventSchema = z.object({
  title: z.string()
    .min(1, '제목은 필수입니다.')
    .min(3, '제목은 최소 3자 이상이어야 합니다.')
    .max(100, '제목은 100자 이하여야 합니다.'),

  description: z.string()
    .max(1000, '설명은 1000자 이하여야 합니다.')
    .optional()
    .default(''),

  location: z.string()
    .min(1, '장소는 필수입니다.')
    .max(100, '장소는 100자 이하여야 합니다.'),

  eventDate: z.string()
    .datetime('유효한 날짜와 시간을 입력해주세요.'),

  maxCapacity: z.coerce.number()
    .int('정수를 입력해주세요.')
    .min(1, '최대 참가자 수는 1명 이상이어야 합니다.')
    .max(1000, '최대 참가자 수는 1000명 이하여야 합니다.'),

  imageUrl: z.string()
    .url('유효한 URL을 입력해주세요.')
    .optional()
    .default(''),
});

// 생성 스키마
export const createEventSchema = baseEventSchema;

// 수정 스키마 (ID 포함)
export const updateEventSchema = baseEventSchema.extend({
  id: z.string().uuid('유효한 이벤트 ID가 필요합니다.'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
```

---

## 신규 컴포넌트

### 1. `components/events/event-form.tsx`

**목표**: React Hook Form + Zod를 사용한 재사용 가능한 폼 컴포넌트

**Props**:
```typescript
interface EventFormProps {
  mode: 'create' | 'edit';
  defaultValues?: CreateEventInput | UpdateEventInput;
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>;
  isLoading?: boolean;
}
```

**상세 구현**:

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createEventSchema,
  updateEventSchema,
  CreateEventInput,
  UpdateEventInput,
} from '@/lib/validations/event';

interface EventFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateEventInput | UpdateEventInput>;
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({
  mode,
  defaultValues,
  onSubmit,
  isLoading = false,
}: EventFormProps) {
  const schema = mode === 'create' ? createEventSchema : updateEventSchema;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      location: '',
      eventDate: '',
      maxCapacity: 10,
      imageUrl: '',
    },
  });

  // eventDate를 date + time으로 분리 (UI용)
  const [date, setDate] = useState(
    defaultValues?.eventDate
      ? new Date(defaultValues.eventDate).toISOString().split('T')[0]
      : ''
  );
  const [time, setTime] = useState(
    defaultValues?.eventDate
      ? new Date(defaultValues.eventDate).toTimeString().slice(0, 5)
      : '09:00'
  );

  const handleSubmit = async (data: CreateEventInput | UpdateEventInput) => {
    setIsSubmitting(true);
    try {
      // date + time → ISO 8601 형식으로 변환
      const eventDate = new Date(`${date}T${time}`);
      if (isNaN(eventDate.getTime())) {
        toast.error('유효한 날짜와 시간을 입력해주세요.');
        return;
      }

      const submittedData = {
        ...data,
        eventDate: eventDate.toISOString(),
      };

      // 더미 딜레이 (실제 API 호출 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 사용자 정의 onSubmit 호출
      await onSubmit(submittedData);
    } catch (error) {
      toast.error('폼 제출에 실패했습니다.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* 제목 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="이벤트 제목을 입력해주세요."
                  {...field}
                  disabled={isSubmitting || isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 설명 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="이벤트 설명을 입력해주세요."
                  rows={5}
                  {...field}
                  disabled={isSubmitting || isLoading}
                />
              </FormControl>
              <FormDescription>
                최대 1000자까지 입력 가능합니다. ({field.value.length}/1000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 장소 */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>장소 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="이벤트 장소를 입력해주세요."
                  {...field}
                  disabled={isSubmitting || isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 날짜 + 시간 (분리 입력) */}
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>날짜 *</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting || isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>시간 *</FormLabel>
            <FormControl>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isSubmitting || isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        {/* 최대 참가자 수 */}
        <FormField
          control={form.control}
          name="maxCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>최대 참가자 수 *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="10"
                  min="1"
                  max="1000"
                  {...field}
                  disabled={isSubmitting || isLoading}
                />
              </FormControl>
              <FormDescription>
                1명 이상 1000명 이하로 설정해주세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 이미지 URL */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이미지 URL (선택)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...field}
                  disabled={isSubmitting || isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 제출 버튼 */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? '저장 중...' : mode === 'create' ? '생성' : '수정'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**주요 구현 세부사항**:
1. `date` + `time` 분리 입력 → ISO 8601 형식으로 합산
2. React Hook Form의 `register`, `formState.errors` 활용
3. Zod 스키마로 자동 유효성 검사
4. 제출 중 버튼 비활성화 + "저장 중..." 텍스트

---

### 2. `components/events/edit-event-form-client.tsx`

**목표**: 수정 페이지에서 서버 데이터를 클라이언트 폼에 전달하는 래퍼

**Props**:
```typescript
interface EditEventFormClientProps {
  event: any;  // getEventWithStats 반환 타입
}
```

**구현**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EventForm } from './event-form';
import { UpdateEventInput } from '@/lib/validations/event';

interface EditEventFormClientProps {
  event: {
    id: string;
    title: string;
    description?: string;
    location: string;
    eventDate: string;
    maxCapacity: number;
    imageUrl?: string;
  };
}

export function EditEventFormClient({ event }: EditEventFormClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: UpdateEventInput) => {
    try {
      // 더미 제출 (실제 API 호출 시뮬레이션)
      console.log('Event updated:', data);
      toast.success('이벤트가 수정되었습니다.');

      // 대시보드로 리다이렉트
      router.push('/protected/dashboard');
    } catch (error) {
      toast.error('이벤트 수정에 실패했습니다.');
      console.error('Update error:', error);
    }
  };

  return (
    <EventForm
      mode="edit"
      defaultValues={{
        id: event.id,
        title: event.title,
        description: event.description || '',
        location: event.location,
        eventDate: event.eventDate,
        maxCapacity: event.maxCapacity,
        imageUrl: event.imageUrl || '',
      }}
      onSubmit={handleSubmit}
    />
  );
}
```

---

## 수정 파일

### 1. `app/protected/events/new/page.tsx`

**변경 사항**: EventForm 생성 모드 통합

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EventForm } from '@/components/events/event-form';
import { CreateEventInput } from '@/lib/validations/event';

export default function NewEventPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateEventInput) => {
    try {
      // 더미 제출 (실제 API 호출 시뮬레이션)
      console.log('Event created:', data);

      // 1초 딜레이 후 토스트 + 리다이렉트
      toast.success('이벤트가 생성되었습니다.');

      // 대시보드로 리다이렉트
      router.push('/protected/dashboard');
    } catch (error) {
      toast.error('이벤트 생성에 실패했습니다.');
      console.error('Create error:', error);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">새 이벤트 생성</h1>
        <p className="text-muted-foreground">
          새로운 이벤트를 만들고 친구들을 초대하세요.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <EventForm
          mode="create"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
```

---

### 2. `app/protected/events/[id]/edit/page.tsx`

**변경 사항**: Next.js 15 params Promise + EditEventFormClient 통합

```typescript
import { getEventWithStats } from '@/lib/data/mock-data';
import { EditEventFormClient } from '@/components/events/edit-event-form-client';
import { notFound } from 'next/navigation';

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;

  // 서버에서 이벤트 데이터 조회
  const event = getEventWithStats(id);

  if (!event) {
    notFound();
  }

  // 주최자 권한 확인 (더미 로직)
  const MOCK_HOST_USER_ID = 'user-001';
  if (event.hostId !== MOCK_HOST_USER_ID) {
    notFound();
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">이벤트 수정</h1>
        <p className="text-muted-foreground">
          이벤트 정보를 수정하세요.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <EditEventFormClient event={event} />
      </div>
    </div>
  );
}
```

---

## 필수 라이브러리 확인

### 설치 여부 확인
```bash
npm list react-hook-form zod @hookform/resolvers
```

### 미설치 시 설치
```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## 검증 체크리스트

- [ ] Zod 스키마 정의 (lib/validations/event.ts)
- [ ] EventForm 컴포넌트 생성
  - [ ] 제목 유효성 검사 (3~100자)
  - [ ] 장소 필수 필드
  - [ ] 날짜/시간 분리 입력
  - [ ] maxCapacity 1~1000 범위
  - [ ] 설명 1000자 제한
- [ ] 생성 페이지 (app/protected/events/new/page.tsx)
  - [ ] 빈 폼으로 시작
  - [ ] 제출 시 1초 딜레이 → toast.success → /protected/dashboard 리다이렉트
- [ ] 수정 페이지 (app/protected/events/[id]/edit/page.tsx)
  - [ ] params: Promise<{id}> 처리 ✓
  - [ ] 초기값 로드
  - [ ] 주최자 권한 확인 (notFound)
- [ ] EditEventFormClient 래퍼
  - [ ] 서버 데이터 → 클라이언트 폼
  - [ ] 제출 시 /protected/dashboard 리다이렉트
- [ ] 폼 필드 UI
  - [ ] 모바일(320px) 레이아웃 확인
  - [ ] 에러 메시지 표시
  - [ ] 비활성화 상태 (제출 중)
- [ ] 다크 모드 스타일 확인
- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과

---

## 참고사항

### React Hook Form 주요 API
- `useForm()`: 폼 인스턴스 생성
- `FormField`: 필드 컴포넌트 (form.control 연결)
- `fieldState.error`: 필드 유효성 검사 에러
- `formState.isSubmitting`: 제출 중 상태

### Zod 검증 메시지
- `.min()`, `.max()`: 길이 범위
- `.url()`: URL 형식 검증
- `.datetime()`: ISO 8601 형식 검증
- `.coerce.number()`: 문자열을 숫자로 변환

### eventDate 변환 로직
```typescript
// 입력: date="2025-12-25", time="14:30"
// 변환: new Date("2025-12-25T14:30")
// 출력: 2025-12-25T14:30:00.000Z
```
