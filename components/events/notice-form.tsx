'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createNotice } from '@/lib/actions/notice';

interface NoticeFormProps {
  eventId: string;
}

export function NoticeForm({ eventId }: NoticeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [content, setContent] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = content.trim();
    if (!trimmed) {
      setError('공지사항 내용을 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const result = await createNotice(eventId, trimmed);

      if (result.success) {
        setContent('');
        setSuccess(true);
        // 3초 후 성공 메시지 자동 숨김
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error ?? '공지사항 등록에 실패했습니다.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>공지사항이 등록되었습니다.</AlertDescription>
        </Alert>
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="공지사항 내용을 입력해주세요 (최대 1000자)"
        rows={4}
        maxLength={1000}
        disabled={isPending}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{content.length} / 1000자</span>
        <Button type="submit" disabled={isPending || !content.trim()}>
          {isPending ? '등록 중...' : '공지 등록'}
        </Button>
      </div>
    </form>
  );
}
