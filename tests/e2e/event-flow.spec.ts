import { test, expect } from '@playwright/test';
import { generateTestEmail, signUp, signIn, signOut, createEvent, applyToEvent } from './helpers';

/**
 * 이벤트 통합 플로우 E2E 테스트
 *
 * 시나리오: 호스트 → 이벤트 생성 → 참가자 참가 신청 → 공지사항 확인
 *
 * 검증 항목:
 * 1. 회원가입 (호스트 사용자)
 * 2. 로그인 후 이벤트 생성
 * 3. 다른 사용자로 참가 신청
 * 4. 대시보드에서 참가 이벤트 확인
 * 5. 호스트가 공지사항 작성
 * 6. 참가자가 공지사항 확인
 */
test.describe('이벤트 통합 플로우', () => {
  // 각 테스트마다 고유한 이메일 사용
  const testPassword = 'TestPass123!';
  let hostEmail: string;
  let participantEmail: string;
  let createdEventId: string;
  const eventTitle = `E2E 테스트 이벤트 ${Date.now()}`;

  test.beforeAll(() => {
    hostEmail = generateTestEmail('host');
    participantEmail = generateTestEmail('participant');
  });

  test('회원가입 → 이벤트 생성 → 참가 신청 → 공지사항 확인 플로우', async ({ page }) => {
    // ================================================================
    // 1단계: 호스트 회원가입
    // ================================================================
    await test.step('호스트 회원가입', async () => {
      await signUp(page, hostEmail, testPassword);

      // 회원가입 성공 페이지 또는 대시보드 확인
      const currentUrl = page.url();
      expect(
        currentUrl.includes('sign-up-success') || currentUrl.includes('dashboard')
      ).toBeTruthy();
    });

    // ================================================================
    // 2단계: 호스트 로그인 (회원가입 후 자동 로그인되지 않는 경우 대비)
    // ================================================================
    await test.step('호스트 로그인', async () => {
      // 이미 대시보드에 있으면 로그인 스킵
      if (!page.url().includes('dashboard')) {
        await signIn(page, hostEmail, testPassword);
      }

      // 대시보드 확인
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
    });

    // ================================================================
    // 3단계: 이벤트 생성
    // ================================================================
    await test.step('이벤트 생성', async () => {
      createdEventId = await createEvent(page, {
        title: eventTitle,
        description: 'E2E 테스트용 이벤트입니다.',
        location: '서울 강남구 테헤란로 123',
        maxCapacity: 5,
      });

      // 이벤트 관리 페이지에 제목이 표시되는지 확인
      await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();

      // URL에 이벤트 ID가 포함되어 있는지 확인
      expect(page.url()).toContain(createdEventId);
      expect(page.url()).toContain('/manage');
    });

    // ================================================================
    // 4단계: 호스트 로그아웃
    // ================================================================
    await test.step('호스트 로그아웃', async () => {
      await signOut(page);
    });

    // ================================================================
    // 5단계: 참가자 회원가입 및 로그인
    // ================================================================
    await test.step('참가자 회원가입 및 로그인', async () => {
      await signUp(page, participantEmail, testPassword);

      // 회원가입 후 자동 로그인 또는 수동 로그인
      if (!page.url().includes('dashboard')) {
        await signIn(page, participantEmail, testPassword);
      }

      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });
    });

    // ================================================================
    // 6단계: 이벤트 목록에서 생성된 이벤트 확인
    // ================================================================
    await test.step('이벤트 목록에서 생성된 이벤트 확인', async () => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');

      // 이벤트 목록 페이지 헤딩 확인
      await expect(page.getByRole('heading', { name: '이벤트 목록' })).toBeVisible();

      // 생성된 이벤트 카드가 목록에 표시되는지 확인
      await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10000 });
    });

    // ================================================================
    // 7단계: 이벤트 상세 페이지에서 참가 신청
    // ================================================================
    await test.step('이벤트 상세 페이지에서 참가 신청', async () => {
      await applyToEvent(page, createdEventId);

      // 참가 확정 상태 확인
      const confirmedBadge = page.getByTestId('participation-status-confirmed');
      const waitlistBadge = page.getByTestId('participation-status-waitlist');

      // confirmed 또는 waitlist 상태 중 하나여야 함
      const isConfirmed = await confirmedBadge.isVisible();
      const isWaitlist = await waitlistBadge.isVisible();

      expect(isConfirmed || isWaitlist).toBeTruthy();
    });

    // ================================================================
    // 8단계: 대시보드에서 참가 이벤트 확인
    // ================================================================
    await test.step('대시보드에서 참가 이벤트 섹션 확인', async () => {
      await page.goto('/protected/dashboard');
      await page.waitForLoadState('networkidle');

      // "참가 중인 이벤트" 섹션 확인
      await expect(page.getByRole('heading', { name: '참가 중인 이벤트' })).toBeVisible();

      // 참가한 이벤트 제목이 표시되는지 확인
      await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10000 });
    });

    // ================================================================
    // 9단계: 참가자 로그아웃 후 호스트로 재로그인
    // ================================================================
    await test.step('호스트로 재로그인', async () => {
      await signOut(page);
      await signIn(page, hostEmail, testPassword);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });
    });

    // ================================================================
    // 10단계: 이벤트 관리 페이지에서 공지사항 작성
    // ================================================================
    await test.step('이벤트 관리 페이지에서 공지사항 작성', async () => {
      await page.goto(`/protected/events/${createdEventId}/manage`);
      await page.waitForLoadState('networkidle');

      // 이벤트 제목 확인
      await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();

      // 공지사항 텍스트 영역에 내용 입력
      const noticeTextarea = page.getByPlaceholder(/공지사항 내용/);
      await noticeTextarea.waitFor({ state: 'visible', timeout: 10000 });
      await noticeTextarea.fill('환영합니다!');

      // 공지 등록 버튼 클릭
      await page.getByRole('button', { name: '공지 등록' }).click();

      // 성공 메시지 확인
      await expect(page.getByText('공지사항이 등록되었습니다')).toBeVisible({ timeout: 10000 });
    });

    // ================================================================
    // 11단계: 호스트 로그아웃 후 참가자로 로그인
    // ================================================================
    await test.step('참가자로 재로그인', async () => {
      await signOut(page);
      await signIn(page, participantEmail, testPassword);
      await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });
    });

    // ================================================================
    // 12단계: 이벤트 상세에서 공지사항 확인 (confirmed 참가자는 조회 가능)
    // ================================================================
    await test.step('참가자가 이벤트 공지사항 확인', async () => {
      await page.goto(`/events/${createdEventId}`);
      await page.waitForLoadState('networkidle');

      // 참가 상태 확인 (confirmed이어야 공지사항 조회 가능)
      const confirmedBadge = page.getByTestId('participation-status-confirmed');

      if (await confirmedBadge.isVisible()) {
        // confirmed 참가자: 공지사항 표시 확인
        await expect(page.getByRole('heading', { name: '공지사항' })).toBeVisible({
          timeout: 10000,
        });
        await expect(page.getByText('환영합니다!')).toBeVisible();
      } else {
        // waitlist 참가자: 공지사항 표시 안 됨
        const noticeSection = page.getByRole('heading', { name: '공지사항' });
        await expect(noticeSection).not.toBeVisible();
      }
    });
  });
});
