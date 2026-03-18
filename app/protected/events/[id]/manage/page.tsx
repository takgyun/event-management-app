import Link from 'next/link';

export default function ManageEventPage({
  params,
}: {
  params: { id: string };
}) {
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
          <h1 className="text-3xl font-bold">이벤트 관리</h1>
          <p className="text-muted-foreground mt-2">ID: {params.id}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">참가자 관리</h2>
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            참가자 목록 플레이스홀더
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">공지사항</h2>
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            공지사항 플레이스홀더
          </div>
        </section>
      </div>
    </div>
  );
}
