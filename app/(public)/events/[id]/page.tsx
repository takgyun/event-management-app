import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MapPin, Users, Clock, User, FileText } from 'lucide-react';
import { getEventWithStats, getNoticesByEventId } from '@/lib/data/mock-data';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const event = getEventWithStats(params.id);

  if (!event) {
    notFound();
  }

  const notices = getNoticesByEventId(params.id);
  const formattedDate = format(new Date(event.eventDate), 'M월 d일 (E) HH:mm', {
    locale: ko,
  });

  const remainingCapacity = event.maxCapacity - event.confirmedCount;

  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-4xl space-y-8">
        {/* 돌아가기 */}
        <Link href="/events" className="text-sm text-blue-500 hover:underline inline-block">
          ← 돌아가기
        </Link>

        {/* 기본 정보 */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold break-words">{event.title}</h1>
              <p className="text-muted-foreground mt-2">주최: {event.host.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <EventStatusBadge status={event.status} />
            </div>
          </div>

          {event.description && (
            <p className="text-base text-foreground whitespace-pre-wrap">{event.description}</p>
          )}
        </div>

        <Separator />

        {/* 이벤트 정보 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 일시 및 장소 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">일시 및 장소</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">일시</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">장소</p>
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
                <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">확정</p>
                  <p className="font-medium text-lg">{event.confirmedCount} / {event.maxCapacity}명</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    남은 자리: {remainingCapacity}명
                  </p>
                </div>
              </div>
              {event.waitlistCount > 0 && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">대기</p>
                      <p className="font-medium">{event.waitlistCount}명</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 공지사항 */}
        {notices.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl font-bold">공지사항</h2>
              </div>
              <div className="space-y-3">
                {notices.map(notice => (
                  <Card key={notice.id}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
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
