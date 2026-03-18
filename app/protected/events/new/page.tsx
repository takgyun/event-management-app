import Link from 'next/link';

export default function CreateEventPage() {
  return (
    <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl space-y-6 sm:space-y-8">
        <Link
          href="/protected/dashboard"
          className="text-sm text-blue-500 hover:underline"
        >
          ← 돌아가기
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">새 이벤트 만들기</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-4">
            (Phase 2에서 폼 구현 예정)
          </p>
        </div>
      </div>
    </div>
  );
}
