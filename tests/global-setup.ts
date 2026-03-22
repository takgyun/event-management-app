import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { TEST_ACCOUNTS } from './e2e/test-accounts';

// .env.local 파일에서 환경 변수 로드
config({ path: '.env.local' });

/**
 * Playwright 글로벌 셋업
 *
 * 테스트 실행 전에 한 번 실행되어 E2E 테스트용 계정을 준비합니다.
 *
 * 우선순위:
 * 1. SUPABASE_SERVICE_ROLE_KEY가 있으면 admin API로 미리 확인된 계정 생성
 * 2. 없으면 브라우저로 회원가입 시도 (이메일 확인 비활성화 필요)
 */
export default async function globalSetup(_config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('[global-setup] NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 없습니다.');
    return;
  }

  if (serviceRoleKey) {
    // ── 방법 1: 서비스 롤 키로 Admin API 사용 ──────────────────────────────
    console.warn('[global-setup] 서비스 롤 키로 테스트 계정 생성 중...');
    await setupWithServiceRole(supabaseUrl, serviceRoleKey);
  } else {
    // ── 방법 2: 브라우저 회원가입 (이메일 확인 비활성화 필요) ──────────────
    console.warn('[global-setup] Supabase 대시보드에서 수동으로 테스트 계정을 생성하거나 SUPABASE_SERVICE_ROLE_KEY를 설정하세요.');
    console.warn('[global-setup] 테스트 계정 이메일:');
    Object.entries(TEST_ACCOUNTS).forEach(([name, account]) => {
      console.warn(`  - ${name}: ${account.email}`);
    });
  }
}

async function setupWithServiceRole(supabaseUrl: string, serviceRoleKey: string) {
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const [name, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      // 이미 존재하는 사용자인지 확인
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const exists = existingUsers?.users?.some((u) => u.email === account.email);

      if (exists) {
        console.warn(`[global-setup] ✓ ${name} (${account.email}) 이미 존재`);
        continue;
      }

      // 새 사용자 생성 (이메일 확인 없이 즉시 활성화)
      const { error } = await adminClient.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // 이메일 확인 없이 즉시 활성화
      });

      if (error) {
        console.error(`[global-setup] ✗ ${name} 생성 실패: ${error.message}`);
      } else {
        console.warn(`[global-setup] ✓ ${name} (${account.email}) 생성 완료`);
      }
    } catch (err) {
      console.error(`[global-setup] ✗ ${name} 오류: ${err}`);
    }
  }
}

