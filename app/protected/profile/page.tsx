import { Suspense } from 'react';
import { getProfile } from '@/lib/actions/profile';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile-form';

export const metadata = {
  title: '프로필',
  description: '사용자 프로필 관리',
};

async function ProfileContent() {
  const supabase = await createClient();

  // 현재 사용자 이메일 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 프로필 데이터 조회
  const { profile, error } = await getProfile();

  return (
    <>
      <ProfileForm profile={profile} email={user?.email ?? ''} />
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">프로필 관리</h1>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
