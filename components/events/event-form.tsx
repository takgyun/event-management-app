'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createEvent, updateEvent } from '@/lib/actions/event';
import type { Event } from '@/lib/types';

interface EventFormProps {
  /** 수정 모드일 때 기존 이벤트 데이터 전달 */
  event?: Event;
  mode: 'create' | 'edit';
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // datetime-local 입력을 위한 ISO 날짜 변환 헬퍼
  // "2026-03-20T18:00" 형태의 로컬 시간 → ISO 8601 (UTC)
  function localDatetimeToIso(localDatetime: string): string {
    // datetime-local 값은 "YYYY-MM-DDTHH:mm" 형태
    // Date 생성자에 전달하면 로컬 타임존 기준으로 파싱
    return new Date(localDatetime).toISOString();
  }

  // 기존 이벤트 날짜를 datetime-local 입력용으로 변환
  function isoToLocalDatetime(iso: string): string {
    const date = new Date(iso);
    // YYYY-MM-DDTHH:mm 형태 반환 (초 제거)
    return date.toISOString().slice(0, 16);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    // datetime-local 값을 ISO 8601으로 변환 (생성 모드에서만)
    if (mode === 'create') {
      const rawDate = formData.get('eventDate') as string;
      if (rawDate) {
        formData.set('eventDate', localDatetimeToIso(rawDate));
      }
    }

    startTransition(async () => {
      let result;

      if (mode === 'create') {
        result = await createEvent(formData);
        if (result.success && result.data) {
          // 생성 성공 시 관리 페이지로 이동
          router.push(`/protected/events/${result.data.id}/manage`);
          return;
        }
      } else if (mode === 'edit' && event) {
        result = await updateEvent(event.id, formData);
        if (result.success) {
          // 수정 성공 시 관리 페이지로 이동
          router.push(`/protected/events/${event.id}/manage`);
          return;
        }
      }

      // 에러 처리
      if (result && !result.success) {
        setError(result.error ?? '오류가 발생했습니다.');
        if ('fieldErrors' in result && result.fieldErrors) {
          setFieldErrors(result.fieldErrors as Record<string, string[]>);
        }
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* 전체 오류 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 이벤트 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">이벤트 제목 *</Label>
        <Input
          id="title"
          name="title"
          placeholder="이벤트 제목을 입력해주세요 (3~100자)"
          defaultValue={event?.title ?? ''}
          required
        />
        {fieldErrors.title && <p className="text-destructive text-sm">{fieldErrors.title[0]}</p>}
      </div>

      {/* 이벤트 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">이벤트 설명</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="이벤트에 대한 설명을 입력해주세요 (최대 500자)"
          defaultValue={event?.description ?? ''}
          rows={4}
        />
        {fieldErrors.description && (
          <p className="text-destructive text-sm">{fieldErrors.description[0]}</p>
        )}
      </div>

      {/* 이벤트 날짜 (생성 모드에서만 수정 가능) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="eventDate">이벤트 일시 *</Label>
          <Input id="eventDate" name="eventDate" type="datetime-local" required />
          {fieldErrors.eventDate && (
            <p className="text-destructive text-sm">{fieldErrors.eventDate[0]}</p>
          )}
        </div>
      )}

      {/* 수정 모드에서는 날짜 표시만 (변경 불가) */}
      {mode === 'edit' && event && (
        <div className="space-y-2">
          <Label>이벤트 일시</Label>
          <Input value={isoToLocalDatetime(event.eventDate)} disabled className="bg-muted" />
          <p className="text-muted-foreground text-xs">이벤트 날짜는 수정할 수 없습니다.</p>
        </div>
      )}

      {/* 장소 */}
      <div className="space-y-2">
        <Label htmlFor="location">장소 *</Label>
        <Input
          id="location"
          name="location"
          placeholder="이벤트 장소를 입력해주세요 (3~100자)"
          defaultValue={event?.location ?? ''}
          required
        />
        {fieldErrors.location && (
          <p className="text-destructive text-sm">{fieldErrors.location[0]}</p>
        )}
      </div>

      {/* 최대 정원 (생성 모드에서만 수정 가능) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="maxCapacity">최대 정원 *</Label>
          <Input
            id="maxCapacity"
            name="maxCapacity"
            type="number"
            placeholder="최대 참가 인원을 입력해주세요 (1~1000)"
            min={1}
            max={1000}
            required
          />
          {fieldErrors.maxCapacity && (
            <p className="text-destructive text-sm">{fieldErrors.maxCapacity[0]}</p>
          )}
        </div>
      )}

      {/* 수정 모드에서는 정원 표시만 (변경 불가) */}
      {mode === 'edit' && event && (
        <div className="space-y-2">
          <Label>최대 정원</Label>
          <Input value={`${event.maxCapacity}명`} disabled className="bg-muted" />
          <p className="text-muted-foreground text-xs">정원은 수정할 수 없습니다.</p>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending
            ? mode === 'create'
              ? '생성 중...'
              : '수정 중...'
            : mode === 'create'
              ? '이벤트 만들기'
              : '수정 완료'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="flex-1"
        >
          취소
        </Button>
      </div>
    </form>
  );
}
