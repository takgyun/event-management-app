import { EventStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const getVariantAndLabel = (status: EventStatus) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, label: '모집 중' };
      case 'cancelled':
        return { variant: 'destructive' as const, label: '취소됨' };
      case 'completed':
        return { variant: 'secondary' as const, label: '완료' };
      default:
        return { variant: 'default' as const, label: '알 수 없음' };
    }
  };

  const { variant, label } = getVariantAndLabel(status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
