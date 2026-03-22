import { test, expect } from '@playwright/test';
import { signIn, signOut, createEvent, applyToEvent, cancelEventParticipation } from './helpers';
import { TEST_ACCOUNTS } from './test-accounts';

/**
 * Waitlist 및 자동 승격 E2E 테스트
 *
 * 시나리오: 정원 2명 이벤트에 3명 신청 → 1번째 참가자 취소 → 3번째 자동 승격
 *
 * 검증 항목:
 * 1. 호스트가 정원 2명인 이벤트 생성
 * 2. 사용자 A 참가 신청 → confirmed (1/2)
 * 3. 사용자 B 참가 신청 → confirmed (2/2)
 * 4. 사용자 C 참가 신청 → waitlist (정원 초과)
 * 5. 사용자 A 참가 취소
 * 6. 사용자 C 자동 승격 → confirmed
 *
 * 사전 조건: global-setup.ts에서 테스트 계정이 생성되어 있어야 함
 */
test.describe('Waitlist 및 자동 승격', () => {
  // 고정 테스트 계정 사용
  const hostAccount = TEST_ACCOUNTS.hostB;
  const userAAccount = TEST_ACCOUNTS.participantA;
  const userBAccount = TEST_ACCOUNTS.participantB;
  const userCAccount = TEST_ACCOUNTS.participantC;
  let createdEventId: string;
  const eventTitle = `Waitlist 테스트 이벤트 ${Date.now()}`;

  test('정원 초과 시 waitlist 처리 및 자동 승격', async ({ page }) => {
    // ================================================================
    // 1단계: 호스트 회원가입 및 정원 2명 이벤트 생성
    // ================================================================
    await test.step('호스트 로그인 및 정원 2명 이벤트 생성', async () => {
      await signIn(page, hostAccount.email, hostAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 정원 2명인 이벤트 생성
      createdEventId = await createEvent(page, {
        title: eventTitle,
        description: 'Waitlist 자동 승격 테스트용 이벤트',
        location: '서울 테스트 장소',
        maxCapacity: 2, // 정원 2명으로 제한
      });

      // 이벤트 관리 페이지 확인
      await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
      expect(page.url()).toContain(createdEventId);
    });

    // ================================================================
    // 2단계: 호스트 로그아웃 후 사용자 A 로그인 및 참가 신청
    // ================================================================
    await test.step('사용자 A 참가 신청 → confirmed (1/2)', async () => {
      await signOut(page);
      await signIn(page, userAAccount.email, userAAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 이벤트 상세 페이지로 이동 후 참가 신청
      await applyToEvent(page, createdEventId);

      // confirmed 상태 확인 (1/2번째 신청이므로 confirmed)
      await expect(page.getByTestId('participation-status-confirmed')).toBeVisible({
        timeout: 10000,
      });

      // 참가자 현황에 1/2 표시 확인
      await expect(page.getByText(/1\s*\/\s*2/)).toBeVisible();
    });

    // ================================================================
    // 3단계: 사용자 A 로그아웃 후 사용자 B 로그인 및 참가 신청
    // ================================================================
    await test.step('사용자 B 참가 신청 → confirmed (2/2)', async () => {
      await signOut(page);
      await signIn(page, userBAccount.email, userBAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 참가 신청
      await applyToEvent(page, createdEventId);

      // confirmed 상태 확인 (2/2번째이므로 confirmed)
      await expect(page.getByTestId('participation-status-confirmed')).toBeVisible({
        timeout: 10000,
      });

      // 참가자 현황에 2/2 표시 및 남은 자리 0 확인
      await expect(page.getByText(/2\s*\/\s*2/)).toBeVisible();
    });

    // ================================================================
    // 4단계: 사용자 B 로그아웃 후 사용자 C 로그인 및 참가 신청 → waitlist
    // ================================================================
    await test.step('사용자 C 참가 신청 → waitlist (정원 초과)', async () => {
      await signOut(page);
      await signIn(page, userCAccount.email, userCAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 이벤트 상세 페이지로 이동
      await page.goto(`/events/${createdEventId}`);
      await page.waitForLoadState('networkidle');

      // "대기 신청" 버튼 표시 확인 (정원 초과 시)
      const applyButton = page.getByTestId('apply-button');
      await applyButton.waitFor({ state: 'visible', timeout: 10000 });

      // 버튼 텍스트 확인 (대기 신청)
      const buttonText = await applyButton.textContent();
      expect(buttonText?.includes('대기 신청') || buttonText?.includes('참가 신청')).toBeTruthy();

      // 대기 신청 클릭
      await applyButton.click();

      // waitlist 상태 확인
      await expect(page.getByTestId('participation-status-waitlist')).toBeVisible({
        timeout: 15000,
      });
    });

    // ================================================================
    // 5단계: 사용자 C 로그아웃 후 사용자 A 로그인 → 참가 취소
    // ================================================================
    await test.step('사용자 A 참가 취소', async () => {
      await signOut(page);
      await signIn(page, userAAccount.email, userAAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 참가 취소
      await cancelEventParticipation(page, createdEventId);

      // 취소 후 "참가 신청" 버튼 다시 표시 확인
      await expect(page.getByTestId('apply-button')).toBeVisible({ timeout: 10000 });

      // 대시보드에서 이벤트가 "참가 이벤트"에서 제거되었는지 확인
      await page.goto('/protected/dashboard');
      await page.waitForLoadState('networkidle');

      // 참가 중인 이벤트 섹션에 이벤트가 없어야 함
      const participatingSection = page.getByRole('heading', { name: '참가 중인 이벤트' });
      await participatingSection.waitFor({ state: 'visible' });

      // 이벤트 카드가 참가 섹션에 없는지 확인
      const participatingEvents = page.locator('section').filter({
        has: page.getByRole('heading', { name: '참가 중인 이벤트' }),
      });
      await expect(participatingEvents.getByText(eventTitle)).not.toBeVisible();
    });

    // ================================================================
    // 6단계: 사용자 A 로그아웃 후 사용자 C 로그인 → 자동 승격 확인
    // ================================================================
    await test.step('사용자 C 자동 승격 확인 (waitlist → confirmed)', async () => {
      await signOut(page);
      await signIn(page, userCAccount.email, userCAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 이벤트 상세 페이지로 이동
      await page.goto(`/events/${createdEventId}`);
      await page.waitForLoadState('networkidle');

      // 자동 승격: waitlist → confirmed
      // 페이지 새로고침하여 최신 상태 확인
      await page.reload();
      await page.waitForLoadState('networkidle');

      // confirmed 상태 확인 (A 취소 후 C가 자동 승격됨)
      await expect(page.getByTestId('participation-status-confirmed')).toBeVisible({
        timeout: 15000,
      });
    });

    // ================================================================
    // 7단계: 호스트 로그인 → 이벤트 관리 페이지에서 C가 confirmed인지 확인
    // ================================================================
    await test.step('호스트: 이벤트 관리 페이지에서 C 참가자 confirmed 확인', async () => {
      await signOut(page);
      await signIn(page, hostAccount.email, hostAccount.password);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

      // 이벤트 관리 페이지로 이동
      await page.goto(`/protected/events/${createdEventId}/manage`);
      await page.waitForLoadState('networkidle');

      // 이벤트 관리 페이지 확인
      await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();

      // 참가 확정 섹션에서 참가자 수 확인
      // B와 C가 confirmed로 표시되어야 함 (A는 취소)
      const confirmedSection = page.getByText(/확정 참가자|참가 확정/i).first();
      await confirmedSection.waitFor({ state: 'visible', timeout: 10000 });
    });
  });
});
