import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MapPin, Users, Clock } from 'lucide-react';
import { EventWithStats, ParticipantStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventStatusBadge } from './event-status-badge';
import { ParticipantStatusBadge } from './participant-status-badge';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  event: EventWithStats;
  variant?: 'list' | 'host' | 'participant';
  participantStatus?: ParticipantStatus;
  className?: string;
}

export function EventCard({
  event,
  variant = 'list',
  participantStatus,
  className,
}: EventCardProps) {
  const formattedDate = format(new Date(event.eventDate), 'M월 d일 (E) HH:mm', {
    locale: ko,
  });

  const participantPercentage = Math.round(
    ((event.confirmedCount + event.waitlistCount) / event.maxCapacity) * 100
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2 text-lg sm:text-xl">{event.title}</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              주최: {event.host.name}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <EventStatusBadge status={event.status} />
            {variant === 'participant' && participantStatus && (
              <ParticipantStatusBadge status={participantStatus} />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-foreground">{event.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="text-foreground">
                {event.confirmedCount}명 / {event.maxCapacity}명
                {event.waitlistCount > 0 && ` (대기 ${event.waitlistCount}명)`}
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min(participantPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* variant별 액션 버튼 */}
        <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
          {variant === 'list' && (
            <Link href={`/events/${event.id}`} className="flex-1">
              <Button variant="outline" className="w-full text-xs sm:text-sm">
                상세 보기
              </Button>
            </Link>
          )}

          {variant === 'host' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
              <Link href={`/events/${event.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                  관리
                </Button>
              </Link>
              <Link href={`/protected/events/${event.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                  수정
                </Button>
              </Link>
            </div>
          )}

          {variant === 'participant' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
              <Link href={`/events/${event.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                  상세 보기
                </Button>
              </Link>
              {participantStatus !== 'cancelled' && (
                <Button variant="ghost" size="sm" className="flex-1 text-xs sm:text-sm">
                  참가 취소
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
