'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ProfileUpdate } from '@/lib/supabase/types';

export async function getProfile() {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !data?.claims) return { profile: null, error: '인증 필요' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.claims.sub)
    .single();

  return { profile, error: error?.message ?? null };
}

export async function updateProfile(updates: Omit<ProfileUpdate, 'id' | 'updated_at'>) {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !data?.claims) return { error: '인증 필요' };

  const { error } = await supabase.from('profiles').update(updates).eq('id', data.claims.sub);

  if (!error) revalidatePath('/protected/profile');
  return { error: error?.message ?? null };
}
