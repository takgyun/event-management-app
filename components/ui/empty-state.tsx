import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className || ''}`}>
      {Icon && <Icon className="mb-4 h-12 w-12 text-muted-foreground" />}

      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>

      {description && <p className="mb-6 text-sm text-muted-foreground">{description}</p>}

      {action && (
        <>
          {action.href ? (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </>
      )}
    </div>
  );
}
