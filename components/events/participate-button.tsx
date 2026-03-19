'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { applyEvent, cancelParticipation } from '@/lib/actions/participant';
import type { ParticipantStatus } from '@/lib/types';

interface ParticipateButtonProps {
  eventId: string;
  /** 현재 사용자의 참가 상태 (null이면 미신청) */
  participantStatus: ParticipantStatus | null;
  /** 이벤트 호스트 여부 (호스트는 신청 불가) */
  isHost: boolean;
  /** 이벤트 상태 */
  eventStatus: string;
  /** 남은 정원 */
  remainingCapacity: number;
}

/**
 * 이벤트 참가 신청/취소 버튼 클라이언트 컴포넌트
 *
 * 상태별 표시:
 * - 미신청 + 자리 있음: "참가 신청" 버튼
 * - 미신청 + 자리 없음: "대기 신청" 버튼
 * - confirmed: "참가 확정됨" + "참가 취소" 버튼
 * - waitlist: "대기 중" + "취소" 버튼
 */
export function ParticipateButton({
  eventId,
  participantStatus,
  isHost,
  eventStatus,
  remainingCapacity,
}: ParticipateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 이벤트가 활성 상태가 아니거나 호스트이면 버튼 숨김
  if (eventStatus !== 'active' || isHost) {
    return null;
  }

  async function handleApply() {
    setError(null);
    startTransition(async () => {
      const result = await applyEvent(eventId);
      if (!result.success) {
        setError(result.error ?? '참가 신청에 실패했습니다.');
      } else {
        // 페이지 새로고침하여 최신 상태 반영
        router.refresh();
      }
    });
  }

  async function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelParticipation(eventId);
      if (!result.success) {
        setError(result.error ?? '참가 취소에 실패했습니다.');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 미신청 상태 */}
      {(!participantStatus || participantStatus === 'cancelled') && (
        <Button
          onClick={handleApply}
          disabled={isPending}
          className="w-full sm:w-auto"
          data-testid="apply-button"
        >
          {isPending
            ? '처리 중...'
            : remainingCapacity > 0
              ? '참가 신청'
              : '대기 신청'}
        </Button>
      )}

      {/* 참가 확정 상태 */}
      {participantStatus === 'confirmed' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <span
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md"
            data-testid="participation-status-confirmed"
          >
            참가 확정됨
          </span>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            size="sm"
            data-testid="cancel-button"
          >
            {isPending ? '처리 중...' : '참가 취소'}
          </Button>
        </div>
      )}

      {/* 대기 상태 */}
      {participantStatus === 'waitlist' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <span
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md"
            data-testid="participation-status-waitlist"
          >
            대기 중
          </span>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            size="sm"
            data-testid="cancel-waitlist-button"
          >
            {isPending ? '처리 중...' : '대기 취소'}
          </Button>
        </div>
      )}
    </div>
  );
}
