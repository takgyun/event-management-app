import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/actions/profile';
import { ProfileForm } from '@/components/profile-form';

export const metadata = {
  title: '프로필',
  description: '사용자 프로필 관리',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 프로필 데이터 조회
  const { profile, error } = await getProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">프로필 관리</h1>
      </div>
      <ProfileForm profile={profile} email={user.email ?? ''} />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
