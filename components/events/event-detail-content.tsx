import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MapPin, Users, Clock, User, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getEventById } from '@/lib/actions/event';
import { getEventNotices } from '@/lib/actions/notice';
import { getUserParticipationStatus } from '@/lib/actions/participant';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { ParticipantStatusBadge } from '@/components/events/participant-status-badge';
import { ParticipateButton } from '@/components/events/participate-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface EventDetailContentProps {
  eventId: string;
}

/**
 * 이벤트 상세 콘텐츠 서버 컴포넌트
 *
 * Suspense 내부에서 렌더링되어 cookies() 동적 접근이 허용됩니다.
 */
export async function EventDetailContent({ eventId }: EventDetailContentProps) {
  // 이벤트 상세 조회 (공개 데이터)
  const eventResult = await getEventById(eventId);

  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  const event = eventResult.data;

  // 현재 사용자 인증 상태 확인 (redirect 없이 단순 조회)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증된 사용자만 참가 상태 및 공지사항 조회
  let participantStatus = null;
  let notices: { id: string; content: string; createdAt: string }[] = [];
  // 현재 사용자가 이벤트 주최자인지 확인
  const isHost = user ? user.id === event.hostId : false;

  if (user) {
    // 현재 사용자의 참가 상태 조회
    const participationResult = await getUserParticipationStatus(eventId);
    if (participationResult.success && participationResult.data) {
      participantStatus = participationResult.data;
    }

    // 공지사항 조회 (주최자 또는 confirmed 참가자만 성공)
    const noticesResult = await getEventNotices(eventId);
    if (noticesResult.success && noticesResult.data) {
      notices = noticesResult.data;
    }
  }

  const formattedDate = format(new Date(event.eventDate), 'M월 d일 (E) HH:mm', {
    locale: ko,
  });

  const remainingCapacity = event.maxCapacity - event.confirmedCount;

  return (
    <div className="flex w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* 돌아가기 */}
        <Link href="/events" className="inline-block text-sm text-blue-500 hover:underline">
          ← 돌아가기
        </Link>

        {/* 기본 정보 */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold break-words sm:text-4xl">{event.title}</h1>
              <p className="text-muted-foreground mt-2">주최: {event.host.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <EventStatusBadge status={event.status} />
              {/* 인증된 사용자의 참가 상태 표시 */}
              {participantStatus && participantStatus.status !== 'cancelled' && (
                <ParticipantStatusBadge status={participantStatus.status} />
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-foreground text-base whitespace-pre-wrap">{event.description}</p>
          )}
        </div>

        <Separator />

        {/* 이벤트 정보 카드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* 일시 및 장소 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">일시 및 장소</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Clock className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">일시</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <MapPin className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">장소</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 참가자 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">참가자 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Users className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">확정</p>
                  <p className="text-lg font-medium">
                    {event.confirmedCount} / {event.maxCapacity}명
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    남은 자리: {remainingCapacity}명
                  </p>
                </div>
              </div>
              {event.waitlistCount > 0 && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <User className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-sm">대기</p>
                      <p className="font-medium">{event.waitlistCount}명</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 참가 신청 버튼 (인증된 사용자 + 비호스트 + active 이벤트) */}
        {user && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">참가</h2>
              <ParticipateButton
                eventId={eventId}
                participantStatus={participantStatus?.status ?? null}
                isHost={isHost}
                eventStatus={event.status}
                remainingCapacity={remainingCapacity}
              />
              {!participantStatus && !isHost && event.status === 'active' && (
                <p className="text-muted-foreground text-xs">
                  {remainingCapacity > 0
                    ? `현재 ${remainingCapacity}자리 남아있습니다.`
                    : '정원이 마감되었습니다. 대기 신청 후 자리가 나면 자동으로 확정됩니다.'}
                </p>
              )}
            </section>
          </>
        )}

        {/* 공지사항 (권한이 있는 경우에만 표시) */}
        {notices.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl font-bold">공지사항</h2>
              </div>
              <div className="space-y-3">
                {notices.map((notice) => (
                  <Card key={notice.id}>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground mb-2 text-sm">
                        {format(new Date(notice.createdAt), 'M월 d일 HH:mm', { locale: ko })}
                      </p>
                      <p className="whitespace-pre-wrap">{notice.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
