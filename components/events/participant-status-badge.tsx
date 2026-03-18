import { ParticipantStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface ParticipantStatusBadgeProps {
  status: ParticipantStatus;
  className?: string;
}

export function ParticipantStatusBadge({ status, className }: ParticipantStatusBadgeProps) {
  const getVariantAndLabel = (status: ParticipantStatus) => {
    switch (status) {
      case 'confirmed':
        return { variant: 'default' as const, label: '참가 확정' };
      case 'waitlist':
        return { variant: 'outline' as const, label: '대기 중' };
      case 'cancelled':
        return { variant: 'secondary' as const, label: '취소' };
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
