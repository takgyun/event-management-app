import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users, FileText, Pencil } from 'lucide-react';
import { getEventById } from '@/lib/actions/event';
import { getEventParticipants } from '@/lib/actions/participant';
import { getEventNotices } from '@/lib/actions/notice';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { ParticipantStatusBadge } from '@/components/events/participant-status-badge';
import { NoticeForm } from '@/components/events/notice-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15: params는 Promise로 처리
  const { id } = await params;

  // 이벤트 상세 조회 (주최자 확인용)
  const eventResult = await getEventById(id);

  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  const event = eventResult.data;

  // 참가자 목록 조회 (requireEventHost 내부에서 주최자 권한 검증)
  const participantsResult = await getEventParticipants(id);

  // 공지사항 목록 조회
  const noticesResult = await getEventNotices(id);

  const participants = participantsResult.success ? (participantsResult.data ?? []) : [];
  const notices = noticesResult.success ? (noticesResult.data ?? []) : [];

  // 상태별 참가자 분류
  const confirmedParticipants = participants.filter((p) => p.status === 'confirmed');
  const waitlistParticipants = participants.filter((p) => p.status === 'waitlist');

  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-4xl space-y-8">
        <Link
          href="/protected/dashboard"
          className="text-sm text-blue-500 hover:underline inline-block"
        >
          ← 돌아가기
        </Link>

        {/* 이벤트 헤더 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">
              {event.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(event.eventDate), 'M월 d일 (E) HH:mm', { locale: ko })} •{' '}
              {event.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <EventStatusBadge status={event.status} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/protected/events/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-1" />
                이벤트 수정
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        {/* 참가 현황 요약 */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-primary">{event.confirmedCount}</p>
              <p className="text-sm text-muted-foreground mt-1">확정</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{event.waitlistCount}</p>
              <p className="text-sm text-muted-foreground mt-1">대기</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{event.maxCapacity - event.confirmedCount}</p>
              <p className="text-sm text-muted-foreground mt-1">남은 자리</p>
            </CardContent>
          </Card>
        </div>

        {/* 참가자 관리 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg sm:text-xl font-bold">참가자 관리</h2>
            <Badge variant="secondary">{participants.length}명</Badge>
          </div>

          {/* 조회 실패 에러 */}
          {!participantsResult.success && (
            <Alert variant="destructive">
              <AlertDescription>{participantsResult.error}</AlertDescription>
            </Alert>
          )}

          {/* 확정 참가자 */}
          {confirmedParticipants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                확정 참가자 ({confirmedParticipants.length}명)
              </h3>
              <div className="border rounded-lg divide-y">
                {confirmedParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">참가자 #{participant.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          신청일:{' '}
                          {format(new Date(participant.appliedAt), 'M월 d일 HH:mm', {
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                    <ParticipantStatusBadge status={participant.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 대기 참가자 */}
          {waitlistParticipants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                대기 중 ({waitlistParticipants.length}명)
              </h3>
              <div className="border rounded-lg divide-y">
                {waitlistParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">대기 #{participant.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          신청일:{' '}
                          {format(new Date(participant.appliedAt), 'M월 d일 HH:mm', {
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                    <ParticipantStatusBadge status={participant.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 참가자 없을 때 */}
          {participantsResult.success && participants.length === 0 && (
            <EmptyState
              title="아직 참가자가 없습니다"
              description="이벤트를 공유하여 참가자를 모집해보세요."
            />
          )}
        </section>

        <Separator />

        {/* 공지사항 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg sm:text-xl font-bold">공지사항</h2>
            {notices.length > 0 && (
              <Badge variant="secondary">{notices.length}건</Badge>
            )}
          </div>

          {/* 공지 작성 폼 (클라이언트 컴포넌트) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">새 공지 작성</CardTitle>
            </CardHeader>
            <CardContent>
              <NoticeForm eventId={id} />
            </CardContent>
          </Card>

          {/* 공지사항 조회 실패 에러 */}
          {!noticesResult.success && (
            <Alert variant="destructive">
              <AlertDescription>{noticesResult.error}</AlertDescription>
            </Alert>
          )}

          {/* 기존 공지사항 목록 */}
          {notices.length > 0 && (
            <div className="space-y-3">
              {notices.map((notice) => (
                <Card key={notice.id}>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(notice.createdAt), 'M월 d일 HH:mm', { locale: ko })}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 공지사항 없을 때 */}
          {noticesResult.success && notices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              아직 등록된 공지사항이 없습니다.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
