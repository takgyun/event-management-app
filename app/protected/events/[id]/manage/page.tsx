import Link from 'next/link';

export default function ManageEventPage({
  params,
}: {
  params: { id: string };
}) {
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">이벤트 관리</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">ID: {params.id}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">참가자 관리</h2>
          <div className="border rounded-lg p-4 sm:p-6 text-center text-muted-foreground">
            참가자 목록 플레이스홀더
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold">공지사항</h2>
          <div className="border rounded-lg p-4 sm:p-6 text-center text-muted-foreground">
            공지사항 플레이스홀더
          </div>
        </section>
      </div>
    </div>
  );
}
