import Link from 'next/link';

export default function CreateEventPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <Link
          href="/protected/dashboard"
          className="text-sm text-blue-500 hover:underline"
        >
          ← 돌아가기
        </Link>

        <div>
          <h1 className="text-3xl font-bold">새 이벤트 만들기</h1>
          <p className="text-muted-foreground mt-4">
            (Phase 2에서 폼 구현 예정)
          </p>
        </div>
      </div>
    </div>
  );
}
