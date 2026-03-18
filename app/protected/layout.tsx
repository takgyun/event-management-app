import { Suspense } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function AuthCheck() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return null;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Suspense fallback={<div />}>
        <AuthCheck />
      </Suspense>
      <AppHeader />
      <main className="flex-1 w-full">{children}</main>
      <AppFooter />
    </div>
  );
}
