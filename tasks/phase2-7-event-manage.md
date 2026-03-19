# Phase 2-7: 이벤트 관리 페이지

## 목표

이벤트 주최자를 위한 관리 페이지 구현:
- 참가자 명단 (확정/대기 탭)
- 참가자 상태 변경 (대기 → 확정 승인)
- 공지사항 작성 및 목록 표시

---

## 신규 컴포넌트

### 1. `components/events/participant-list.tsx`

**목표**: 참가자 목록을 탭으로 구분 (확정/대기)

**Props**:
```typescript
interface ParticipantListProps {
  eventId: string;
  participants: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'confirmed' | 'waitlist';
    joinedAt: string;
  }>;
  onPromote?: (participantId: string) => Promise<void>;
}
```

**구현**:
```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParticipantStatusBadge } from './participant-status-badge';
import { EmptyState } from '@/components/ui/empty-state';

interface Participant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'confirmed' | 'waitlist';
  joinedAt: string;
}

interface ParticipantListProps {
  eventId: string;
  participants: Participant[];
  onPromote?: (participantId: string) => Promise<void>;
}

export function ParticipantList({
  eventId,
  participants,
  onPromote,
}: ParticipantListProps) {
  const [localParticipants, setLocalParticipants] = useState(participants);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);

  const confirmed = localParticipants.filter(p => p.status === 'confirmed');
  const waitlist = localParticipants.filter(p => p.status === 'waitlist');

  const handlePromote = async (participantId: string) => {
    setIsPromoting(participantId);
    try {
      // 더미 로직: 500ms 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));

      // 로컬 상태 업데이트
      setLocalParticipants(prev =>
        prev.map(p =>
          p.id === participantId
            ? { ...p, status: 'confirmed' as const }
            : p
        )
      );

      // onPromote 콜백 호출 (선택)
      if (onPromote) {
        await onPromote(participantId);
      }

      toast.success('참가자를 확정했습니다.');
    } catch (error) {
      toast.error('참가자 승인에 실패했습니다.');
      console.error('Promote error:', error);
    } finally {
      setIsPromoting(null);
    }
  };

  return (
    <Tabs defaultValue="confirmed" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="confirmed">
          확정 ({confirmed.length})
        </TabsTrigger>
        <TabsTrigger value="waitlist">
          대기 ({waitlist.length})
        </TabsTrigger>
      </TabsList>

      {/* 확정 탭 */}
      <TabsContent value="confirmed" className="space-y-4">
        {confirmed.length === 0 ? (
          <EmptyState
            icon="Users"
            title="확정된 참가자가 없습니다."
            description="아직 참가 신청을 수락한 사용자가 없습니다."
          />
        ) : (
          <div className="space-y-2">
            {confirmed.map(participant => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium">{participant.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {participant.userEmail}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    참가: {new Date(participant.joinedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <ParticipantStatusBadge status="confirmed" />
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* 대기 탭 */}
      <TabsContent value="waitlist" className="space-y-4">
        {waitlist.length === 0 ? (
          <EmptyState
            icon="Clock"
            title="대기 중인 참가자가 없습니다."
            description="현재 대기열이 비어있습니다."
          />
        ) : (
          <div className="space-y-2">
            {waitlist.map(participant => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium">{participant.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {participant.userEmail}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    대기: {new Date(participant.joinedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ParticipantStatusBadge status="waitlist" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePromote(participant.id)}
                    disabled={isPromoting === participant.id}
                  >
                    {isPromoting === participant.id ? '승인 중...' : '승인'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
```

**주요 기능**:
- 탭으로 확정/대기자 구분
- 각 참가자의 가입 날짜 표시
- "승인" 버튼으로 대기자 → 확정자 상태 변경
- 500ms 딜레이 더미 로직

---

### 2. `components/events/notice-form.tsx`

**목표**: 공지사항 작성 및 목록 표시

**Props**:
```typescript
interface NoticeFormProps {
  eventId: string;
  onNoticeAdded?: (notice: Notice) => void;
}

interface Notice {
  id: string;
  content: string;
  createdAt: string;
}
```

**구현**:
```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Notice {
  id: string;
  content: string;
  createdAt: string;
}

interface NoticeFormProps {
  eventId: string;
  initialNotices?: Notice[];
  onNoticeAdded?: (notice: Notice) => void;
}

export function NoticeForm({
  eventId,
  initialNotices = [],
  onNoticeAdded,
}: NoticeFormProps) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_LENGTH = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('공지사항을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 500ms 딜레이 (더미)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 새 공지 추가
      const newNotice: Notice = {
        id: `notice-${Date.now()}`,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      setNotices(prev => [newNotice, ...prev]);
      setContent('');

      onNoticeAdded?.(newNotice);
      toast.success('공지사항이 작성되었습니다.');
    } catch (error) {
      toast.error('공지사항 작성에 실패했습니다.');
      console.error('Notice submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 공지사항 작성 폼 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">새 공지사항</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Textarea
              placeholder="참가자들에게 전할 공지사항을 입력해주세요."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/{MAX_LENGTH}
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? '작성 중...' : '공지사항 추가'}
          </Button>
        </form>
      </div>

      {/* 공지사항 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          공지사항 ({notices.length})
        </h3>

        {notices.length === 0 ? (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            아직 공지사항이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(notice => (
              <div
                key={notice.id}
                className="p-4 border rounded-lg bg-muted/30"
              >
                <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notice.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**주요 기능**:
- 공지사항 작성 textarea (500자 제한)
- 글자수 카운터
- 공지사항 목록 (최신순)
- 500ms 딜레이 더미 로직

---

### 3. `components/events/manage-status-buttons.tsx`

**목표**: 이벤트 완료/취소 버튼 (확인 다이얼로그 포함)

**Props**:
```typescript
interface ManageStatusButtonsProps {
  eventId: string;
  eventStatus: 'scheduled' | 'completed' | 'cancelled';
  onStatusChange?: (status: 'completed' | 'cancelled') => Promise<void>;
}
```

**구현**:
```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ManageStatusButtonsProps {
  eventId: string;
  eventStatus: 'scheduled' | 'completed' | 'cancelled';
  onStatusChange?: (status: 'completed' | 'cancelled') => Promise<void>;
}

export function ManageStatusButtons({
  eventId,
  eventStatus,
  onStatusChange,
}: ManageStatusButtonsProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // 500ms 딜레이 (더미)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onStatusChange) {
        await onStatusChange('completed');
      }

      toast.success('이벤트가 완료되었습니다.');
      setShowCompleteDialog(false);
    } catch (error) {
      toast.error('이벤트 완료에 실패했습니다.');
      console.error('Complete error:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      // 500ms 딜레이 (더미)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onStatusChange) {
        await onStatusChange('cancelled');
      }

      toast.success('이벤트가 취소되었습니다.');
      setShowCancelDialog(false);
    } catch (error) {
      toast.error('이벤트 취소에 실패했습니다.');
      console.error('Cancel error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (eventStatus !== 'scheduled') {
    return (
      <div className="p-4 border rounded-lg bg-muted/30">
        <p className="text-sm">
          상태: <span className="font-semibold">
            {eventStatus === 'completed' ? '완료됨' : '취소됨'}
          </span>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3">
        {/* 완료 버튼 */}
        <Button
          onClick={() => setShowCompleteDialog(true)}
          disabled={isCompleting || isCancelling}
          className="flex-1"
        >
          {isCompleting ? '완료 중...' : '이벤트 완료'}
        </Button>

        {/* 취소 버튼 */}
        <Button
          onClick={() => setShowCancelDialog(true)}
          disabled={isCompleting || isCancelling}
          variant="destructive"
          className="flex-1"
        >
          {isCancelling ? '취소 중...' : '이벤트 취소'}
        </Button>
      </div>

      {/* 완료 확인 다이얼로그 */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 완료</AlertDialogTitle>
            <AlertDialogDescription>
              이벤트를 완료하면 더 이상 참가 신청을 받을 수 없습니다.
              정말 완료하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              완료
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 취소 확인 다이얼로그 */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 취소</AlertDialogTitle>
            <AlertDialogDescription>
              이벤트를 취소하면 모든 참가자에게 알림이 전송됩니다.
              정말 취소하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>돌아가기</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive">
              취소
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**주요 기능**:
- "이벤트 완료" 버튼 + 확인 다이얼로그
- "이벤트 취소" 버튼 + 확인 다이얼로그
- 500ms 딜레이 더미 로직
- 완료/취소 후 상태 숨김

---

## 수정 파일

### `app/protected/events/[id]/manage/page.tsx`

**새로 생성**:

```typescript
import { getEventWithStats, getParticipantsByEventId, getNoticesByEventId } from '@/lib/data/mock-data';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParticipantList } from '@/components/events/participant-list';
import { NoticeForm } from '@/components/events/notice-form';
import { ManageStatusButtons } from '@/components/events/manage-status-buttons';

interface ManageEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageEventPage({ params }: ManageEventPageProps) {
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

  // 참가자 및 공지사항 데이터 조회
  const participants = getParticipantsByEventId(id);
  const notices = getNoticesByEventId(id);

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{event.title} 관리</h1>
        <p className="text-muted-foreground">
          {new Date(event.eventDate).toLocaleString('ko-KR')}
        </p>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="participants" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants">참가자</TabsTrigger>
          <TabsTrigger value="notices">공지사항</TabsTrigger>
          <TabsTrigger value="status">상태 관리</TabsTrigger>
        </TabsList>

        {/* 참가자 탭 */}
        <TabsContent value="participants" className="space-y-4">
          <ParticipantList
            eventId={id}
            participants={participants}
          />
        </TabsContent>

        {/* 공지사항 탭 */}
        <TabsContent value="notices" className="space-y-4">
          <NoticeForm
            eventId={id}
            initialNotices={notices}
          />
        </TabsContent>

        {/* 상태 관리 탭 */}
        <TabsContent value="status" className="space-y-4">
          <ManageStatusButtons
            eventId={id}
            eventStatus={event.status || 'scheduled'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Mock Data 함수 확인/추가

### `lib/data/mock-data.ts`에 필요한 함수

```typescript
// 기존 함수 재사용
export function getEventWithStats(eventId: string) {
  return MOCK_EVENTS.find(e => e.id === eventId);
}

// 신규 함수 추가 (없으면)
export function getParticipantsByEventId(eventId: string) {
  const event = MOCK_EVENTS.find(e => e.id === eventId);
  return event?.participants || [];
}

export function getNoticesByEventId(eventId: string) {
  // 더미 공지사항 반환 (실제로는 MOCK_EVENTS에서 notices 속성 조회)
  return [
    {
      id: 'notice-001',
      content: '이벤트 시간을 30분 연장했습니다.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}
```

---

## 검증 체크리스트

- [ ] ParticipantList 컴포넌트
  - [ ] 확정/대기 탭 전환
  - [ ] 각 탭에서 참가자 명단 표시
  - [ ] 대기자 "승인" 버튼 클릭 → 500ms 딜레이 → 상태 변경
  - [ ] EmptyState 표시 (참가자 없을 때)
- [ ] NoticeForm 컴포넌트
  - [ ] 공지사항 입력 (500자 제한)
  - [ ] 글자수 카운터
  - [ ] 제출 버튼 → 500ms 딜레이 → 목록 추가
  - [ ] 공지사항 목록 표시
- [ ] ManageStatusButtons 컴포넌트
  - [ ] "이벤트 완료" 버튼 + 확인 다이얼로그
  - [ ] "이벤트 취소" 버튼 + 확인 다이얼로그
  - [ ] 상태 변경 후 버튼 숨김
- [ ] 관리 페이지 (app/protected/events/[id]/manage/page.tsx)
  - [ ] params: Promise<{id}> 처리 ✓
  - [ ] 주최자 권한 확인 (notFound) ✓
  - [ ] 탭 UI 전환
  - [ ] 참가자/공지 데이터 표시
- [ ] Mock Data 함수
  - [ ] getParticipantsByEventId() 호출
  - [ ] getNoticesByEventId() 호출
- [ ] 모바일(320px) 레이아웃 확인
- [ ] 다크 모드 스타일 확인
- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과

---

## 참고사항

### Tabs 컴포넌트 사용
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="participants">
  <TabsList>
    <TabsTrigger value="participants">참가자</TabsTrigger>
  </TabsList>
  <TabsContent value="participants">
    {/* 내용 */}
  </TabsContent>
</Tabs>
```

### AlertDialog 사용
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

### 더미 로직 패턴
모든 비동기 작업에 500ms setTimeout 적용
