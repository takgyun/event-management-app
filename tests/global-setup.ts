import { chromium, FullConfig } from '@playwright/test';
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
    console.warn('[global-setup] 서비스 롤 키 없음. 브라우저로 회원가입 시도...');
    console.warn('[global-setup] ⚠️  Supabase 대시보드에서 이메일 확인을 비활성화해야 합니다:');
    console.warn('[global-setup]    Authentication > Settings > Email Confirmation 비활성화');
    await setupWithBrowser();
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

async function setupWithBrowser() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const [name, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      // 먼저 로그인 시도 (이미 계정이 있을 수 있음)
      await page.goto(`${baseURL}/auth/login`);
      await page.getByLabel('이메일').fill(account.email);
      await page.getByLabel('비밀번호').fill(account.password);
      await page.getByRole('button', { name: '로그인', exact: true }).click();

      try {
        await page.waitForURL(/protected\/dashboard/, { timeout: 5000 });
        console.warn(`[global-setup] ✓ ${name} (${account.email}) 로그인 성공 (계정 이미 존재)`);
        // 로그아웃
        await page.goto(`${baseURL}/`);
        continue;
      } catch {
        // 로그인 실패 → 회원가입 시도
      }

      // 회원가입
      await page.goto(`${baseURL}/auth/sign-up`);
      await page.getByLabel('이메일').fill(account.email);
      const passwordInputs = page.getByLabel('비밀번호');
      await passwordInputs.first().fill(account.password);
      const repeatInput = page.locator('#repeat-password');
      await repeatInput.fill(account.password);
      await page.getByRole('button', { name: '회원가입', exact: true }).click();

      // 이메일 확인이 비활성화된 경우: dashboard로 이동
      // 이메일 확인이 활성화된 경우: sign-up-success로 이동
      try {
        await page.waitForURL(/sign-up-success|dashboard|protected/, { timeout: 10000 });
        if (page.url().includes('dashboard') || page.url().includes('protected')) {
          console.warn(`[global-setup] ✓ ${name} (${account.email}) 회원가입 및 즉시 활성화`);
        } else {
          console.warn(`[global-setup] ⚠️  ${name} (${account.email}) 이메일 확인 필요 - 테스트가 실패할 수 있습니다`);
        }
      } catch {
        // 회원가입 실패 (rate limit 등)
        const errorText = await page.locator('p.text-red-500, [role="alert"]').textContent().catch(() => '알 수 없는 오류');
        console.warn(`[global-setup] ⚠️  ${name} (${account.email}) 회원가입 실패: ${errorText}`);
      }
    } catch (err) {
      console.error(`[global-setup] ✗ ${name} 처리 중 오류: ${err}`);
    }
  }

  await browser.close();
}
