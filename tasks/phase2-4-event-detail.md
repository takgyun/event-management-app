# Phase 2-4: 이벤트 상세 인터랙션

## 목표

이벤트 상세 페이지에 다음 인터랙션 구현:
- 참가신청/취소 버튼 (상태 기반 UI)
- 초대 링크 복사 버튼 (클립보드 API)
- 미로그인 사용자를 위한 로그인 모달

---

## 신규 컴포넌트

### 1. `components/events/participation-button.tsx`

**목표**: 이벤트 참가 상태를 관리하고, 참가신청/취소 버튼 렌더링

**Props**:
```typescript
interface ParticipationButtonProps {
  eventId: string;
  isLoggedIn: boolean;           // 로그인 여부
  currentUserStatus?: 'confirmed' | 'waitlist' | null;  // 현재 참가 상태
  spotsAvailable: number;         // 남은 참가 가능 수
  maxCapacity: number;            // 최대 참가자 수
  onParticipationChange?: (status: 'confirmed' | 'waitlist' | null) => void; // 상태 변경 콜백
}
```

**상태 분기**:
```
1. isLoggedIn === false
   → "로그인이 필요합니다" 텍스트 + LoginRequiredDialog 트리거

2. isLoggedIn === true && currentUserStatus === null
   → spotsAvailable > 0? "참가신청" : "대기열 신청"
   → 클릭 시: 500ms 딜레이 → 상태 업데이트 → toast

3. isLoggedIn === true && currentUserStatus === 'confirmed'
   → "참가 중" 배지 + "신청 취소" 버튼

4. isLoggedIn === true && currentUserStatus === 'waitlist'
   → "대기 중" 배지 + "대기 취소" 버튼
```

**더미 로직**:
```typescript
const [status, setStatus] = useState<'confirmed' | 'waitlist' | null>(
  currentUserStatus || null
);
const [isLoading, setIsLoading] = useState(false);

const handleParticipate = async () => {
  setIsLoading(true);
  try {
    // 500ms 딜레이 (더미)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 상태 업데이트
    const newStatus = spotsAvailable > 0 ? 'confirmed' : 'waitlist';
    setStatus(newStatus);
    onParticipationChange?.(newStatus);

    toast.success(
      newStatus === 'confirmed'
        ? '참가신청이 완료되었습니다.'
        : '대기열에 등록되었습니다.'
    );
  } finally {
    setIsLoading(false);
  }
};

const handleCancel = async () => {
  setIsLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus(null);
    onParticipationChange?.(null);
    toast.success('참가신청이 취소되었습니다.');
  } finally {
    setIsLoading(false);
  }
};
```

**UI 구성**:
```typescript
if (!isLoggedIn) {
  return <LoginRequiredDialog>로그인이 필요합니다</LoginRequiredDialog>;
}

if (status === null) {
  return (
    <Button
      onClick={handleParticipate}
      disabled={isLoading}
      variant={spotsAvailable > 0 ? 'default' : 'outline'}
    >
      {spotsAvailable > 0 ? '참가신청' : '대기열 신청'}
    </Button>
  );
}

return (
  <div className="flex items-center gap-2">
    <ParticipantStatusBadge status={status} />
    <Button
      onClick={handleCancel}
      disabled={isLoading}
      variant="ghost"
      size="sm"
    >
      취소
    </Button>
  </div>
);
```

---

### 2. `components/events/invite-link-button.tsx`

**목표**: 초대 링크를 클립보드에 복사하고, 사용자 피드백 제공

**Props**:
```typescript
interface InviteLinkButtonProps {
  eventId: string;
  eventTitle: string;
}
```

**구현**:
```typescript
const [isCopied, setIsCopied] = useState(false);

const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventId}`;

const handleCopyLink = async () => {
  try {
    // 1. 클립보드 API 시도
    await navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    toast.success('초대 링크가 복사되었습니다.');

    // 2. 2초 후 상태 리셋
    setTimeout(() => setIsCopied(false), 2000);
  } catch (err) {
    // 3. Web Share API 폴백 (모바일)
    if (navigator.share) {
      navigator.share({
        title: `${eventTitle} 참가 초대`,
        url: inviteLink,
      }).catch(() => {
        toast.error('공유 실패');
      });
    } else {
      toast.error('링크 복사 실패');
    }
  }
};

return (
  <Button
    onClick={handleCopyLink}
    variant="outline"
    size="sm"
    disabled={isCopied}
  >
    {isCopied ? '✓ 복사됨' : '초대 링크 복사'}
  </Button>
);
```

**UI 구성**:
```
기본: [초대 링크 복사 버튼]
클릭 후: [✓ 복사됨] (2초 유지) → [초대 링크 복사]로 복구
실패 시: toast.error('링크 복사 실패')
```

---

### 3. `components/events/login-required-dialog.tsx`

**목표**: 미로그인 사용자 시 표시되는 모달

**Props**:
```typescript
interface LoginRequiredDialogProps {
  eventId?: string;  // 이벤트 ID (선택, 로그인 후 리다이렉트 용도)
  children?: React.ReactNode;
}
```

**구현**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function LoginRequiredDialog({
  eventId,
  children,
}: LoginRequiredDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    const redirectUrl = eventId ? `/events/${eventId}` : '/events';
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground underline hover:text-foreground"
      >
        {children || '로그인이 필요합니다'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>로그인 필요</DialogTitle>
            <DialogDescription>
              이 기능을 사용하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleLogin}>
              로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 수정 파일

### `app/(public)/events/[id]/page.tsx`

**변경 사항**:
1. 컴포넌트 상단에 현재 사용자 시뮬레이션:
```typescript
// Mock: 로그인한 사용자 확인 (향후 실제 Supabase auth로 변경)
const MOCK_CURRENT_USER_ID = 'user-002';
const isLoggedIn = true; // 더미 로그인 상태
```

2. 이벤트 데이터에서 참가 상태 계산:
```typescript
// 현재 사용자의 참가 상태 조회
const currentUserParticipant = event.participants.find(
  p => p.userId === MOCK_CURRENT_USER_ID
);
const currentUserStatus = currentUserParticipant?.status || null;

// 남은 참가 가능 수 계산
const confirmedCount = event.participants.filter(
  p => p.status === 'confirmed'
).length;
const spotsAvailable = event.maxCapacity - confirmedCount;
```

3. 상세 페이지에 컴포넌트 추가:
```typescript
<div className="flex gap-3 items-center">
  <ParticipationButton
    eventId={event.id}
    isLoggedIn={isLoggedIn}
    currentUserStatus={currentUserStatus}
    spotsAvailable={spotsAvailable}
    maxCapacity={event.maxCapacity}
    onParticipationChange={(status) => {
      // 부모 상태 업데이트 로직 (필요시)
      console.log('참가 상태 변경:', status);
    }}
  />
  <InviteLinkButton
    eventId={event.id}
    eventTitle={event.title}
  />
</div>
```

4. 주최자 전용 버튼 추가 (호스트 권한 확인):
```typescript
const isHost = event.hostId === MOCK_CURRENT_USER_ID;

if (isHost) {
  return (
    <Link href={`/protected/events/${event.id}/manage`}>
      <Button variant="outline">관리</Button>
    </Link>
  );
}
```

---

## 데이터 흐름

### Mock Data 활용 (lib/data/mock-data.ts)

```typescript
// 기존 함수 재사용
getEventWithStats(eventId);  // 이벤트 데이터 + 참가자 정보

// 참가자 상태 필터링
const participants = MOCK_EVENTS.find(e => e.id === eventId)?.participants || [];
const confirmed = participants.filter(p => p.status === 'confirmed');
const waitlist = participants.filter(p => p.status === 'waitlist');
```

---

## 검증 체크리스트

- [ ] ParticipationButton 렌더링 (로그인 상태 분기)
- [ ] 참가신청 버튼 클릭 → 500ms 딜레이 → 상태 변경 → toast 표시
- [ ] 참가신청 취소 → 상태 리셋 → toast 표시
- [ ] spotsAvailable = 0일 때 "대기열 신청" 표시
- [ ] InviteLinkButton 클릭 → 2초 "✓ 복사됨" 상태 유지 → 복구
- [ ] 클립보드 복사 실패 시 Web Share API 폴백
- [ ] LoginRequiredDialog 미로그인 상태 반영
- [ ] 로그인 버튼 클릭 → `/auth/login?redirect=/events/[id]` 이동
- [ ] 모바일(320px) 해상도에서 버튼 레이아웃 확인
- [ ] 다크 모드 스타일 확인
- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과

---

## 참고사항

### sonner 토스트 사용
```typescript
import { toast } from 'sonner';

toast.success('성공 메시지');
toast.error('오류 메시지');
```

### 클립보드 API 호환성
- 최신 브라우저: `navigator.clipboard.writeText()` ✓
- 모바일: Web Share API `navigator.share()` ✓
- 폴백 불가능 시: toast.error() 표시 ✓

### 더미 로직 타이밍
- 참가신청 딜레이: 500ms (자연스러운 인터랙션)
- 복사 피드백 유지: 2000ms (사용자 피드백 확인)
