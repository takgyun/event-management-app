import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  signUp,
  signIn,
  signOut,
  createEvent,
  applyToEvent,
} from './helpers';

/**
 * 권한 검증 E2E 테스트
 *
 * 시나리오: 미인증/비주최자/waitlist 사용자 권한 제한 확인
 *
 * 검증 항목:
 * 1. 미인증 사용자: /protected 접근 시 /auth/login 리다이렉트
 * 2. 비주최자: 이벤트 수정 버튼 없음 또는 접근 불가
 * 3. waitlist 사용자: 공지사항 조회 불가
 */
test.describe('권한 검증', () => {
  const testPassword = 'TestPass123!';

  // ================================================================
  // 테스트 1: 미인증 사용자 /protected 접근 시 로그인 리다이렉트
  // ================================================================
  test('미인증 사용자는 /protected 접근 시 로그인 리다이렉트', async ({ page }) => {
    // 브라우저 스토리지 초기화 (로그아웃 상태 보장)
    await page.context().clearCookies();

    // /protected 페이지 직접 접근
    await page.goto('/protected/dashboard');

    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('미인증 사용자는 /protected/events/new 접근 시 로그인 리다이렉트', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/protected/events/new');

    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  // ================================================================
  // 테스트 2: 비주최자는 이벤트 수정 불가
  // ================================================================
  test('비주최자는 이벤트 수정 불가', async ({ page }) => {
    const hostEmail = generateTestEmail('auth-host');
    const otherEmail = generateTestEmail('auth-other');
    const eventTitle = `권한 테스트 이벤트 ${Date.now()}`;
    let eventId: string;

    // 호스트 회원가입 및 이벤트 생성
    await signUp(page, hostEmail, testPassword);
    if (!page.url().includes('dashboard')) {
      await signIn(page, hostEmail, testPassword);
    }
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    eventId = await createEvent(page, {
      title: eventTitle,
      location: '서울 테스트 장소',
      maxCapacity: 10,
    });

    // 호스트 로그아웃
    await signOut(page);

    // 다른 사용자 회원가입 및 로그인
    await signUp(page, otherEmail, testPassword);
    if (!page.url().includes('dashboard')) {
      await signIn(page, otherEmail, testPassword);
    }
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    // 이벤트 상세 페이지로 이동
    await page.goto(`/events/${eventId}`);
    await page.waitForLoadState('networkidle');

    // 이벤트 제목 확인
    await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();

    // 수정 버튼이 없는지 확인 (비주최자에게는 표시되지 않음)
    // 이벤트 상세 페이지 (공개 페이지)에는 수정 버튼이 없어야 함
    const editButton = page
      .getByRole('button', { name: /수정|Edit/i })
      .or(page.getByRole('link', { name: /이벤트 수정/i }));

    // 수정 버튼이 없거나 비활성화 상태여야 함
    const editCount = await editButton.count();
    if (editCount > 0) {
      // 수정 버튼이 있다면 클릭 시 권한 오류가 발생해야 함
      await editButton.first().click();

      // 로그인 리다이렉트 또는 에러 페이지 확인
      const currentUrl = page.url();
      const hasError =
        currentUrl.includes('auth/login') ||
        currentUrl.includes('/edit') === false ||
        (await page.getByText(/권한|허용|접근 불가|오류/i).count()) > 0;

      expect(hasError).toBeTruthy();
    } else {
      // 수정 버튼 자체가 없음 (올바른 동작)
      expect(editCount).toBe(0);
    }
  });

  test('비로그인 상태에서 이벤트 수정 페이지 직접 접근 시 로그인 리다이렉트', async ({
    page,
  }) => {
    const hostEmail = generateTestEmail('auth-edit-host');
    const eventTitle = `수정 권한 테스트 ${Date.now()}`;
    let eventId: string;

    // 호스트 회원가입 및 이벤트 생성
    await signUp(page, hostEmail, testPassword);
    if (!page.url().includes('dashboard')) {
      await signIn(page, hostEmail, testPassword);
    }
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    eventId = await createEvent(page, {
      title: eventTitle,
      location: '서울 테스트 장소',
      maxCapacity: 10,
    });

    // 로그아웃
    await signOut(page);

    // 비로그인 상태에서 수정 페이지 직접 접근
    await page.goto(`/protected/events/${eventId}/edit`);

    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  // ================================================================
  // 테스트 3: waitlist 사용자는 공지사항 조회 불가
  // ================================================================
  test('waitlist 사용자는 공지사항 조회 불가', async ({ page }) => {
    const hostEmail = generateTestEmail('auth-notice-host');
    const userAEmail = generateTestEmail('auth-notice-a');
    const userBEmail = generateTestEmail('auth-notice-b');
    const eventTitle = `공지사항 권한 테스트 ${Date.now()}`;
    let eventId: string;
    const noticeContent = `공지사항 테스트 내용 ${Date.now()}`;

    // -------- 호스트: 정원 1명 이벤트 생성 --------
    await signUp(page, hostEmail, testPassword);
    if (!page.url().includes('dashboard')) {
      await signIn(page, hostEmail, testPassword);
    }
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    // 정원 1명 이벤트 생성
    eventId = await createEvent(page, {
      title: eventTitle,
      location: '서울 테스트 장소',
      maxCapacity: 1, // 정원 1명으로 제한
    });

    await signOut(page);

    // -------- 사용자 A: 참가 신청 → confirmed --------
    await signUp(page, userAEmail, testPassword);
    if (!page.url().includes('dashboard')) {
      await signIn(page, userAEmail, testPassword);
    }
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    await applyToEvent(page, eventId);

    // A는 confirmed 상태여야 함
    await expect(page.getByTestId('participation-status-confirmed')).toBeVisible({
      timeout: 10000,
    });

    await signOut(page);

    // -------- 사용자 B: 참가 신청 → waitlist --------
    await signUp(page, userBEmail, testPassword);
    if (!page.url().includes('dashboard')) {
      await signIn(page, userBEmail, testPassword);
    }
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    // 이벤트 상세 페이지로 이동
    await page.goto(`/events/${eventId}`);
    await page.waitForLoadState('networkidle');

    // 대기 신청 버튼 클릭
    const applyButton = page.getByTestId('apply-button');
    await applyButton.waitFor({ state: 'visible', timeout: 10000 });
    await applyButton.click();

    // B는 waitlist 상태여야 함
    await expect(page.getByTestId('participation-status-waitlist')).toBeVisible({
      timeout: 15000,
    });

    await signOut(page);

    // -------- 호스트: 공지사항 작성 --------
    await signIn(page, hostEmail, testPassword);
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    await page.goto(`/protected/events/${eventId}/manage`);
    await page.waitForLoadState('networkidle');

    // 공지사항 작성
    const noticeTextarea = page.getByPlaceholder(/공지사항 내용/);
    await noticeTextarea.waitFor({ state: 'visible', timeout: 10000 });
    await noticeTextarea.fill(noticeContent);
    await page.getByRole('button', { name: '공지 등록' }).click();

    // 성공 메시지 확인
    await expect(page.getByText('공지사항이 등록되었습니다')).toBeVisible({ timeout: 10000 });

    await signOut(page);

    // -------- 사용자 B (waitlist): 공지사항 조회 불가 확인 --------
    await signIn(page, userBEmail, testPassword);
    await page.waitForURL(/protected\/dashboard/, { timeout: 10000 });

    await page.goto(`/events/${eventId}`);
    await page.waitForLoadState('networkidle');

    // waitlist 상태 확인
    const waitlistBadge = page.getByTestId('participation-status-waitlist');
    await waitlistBadge.waitFor({ state: 'visible', timeout: 10000 });

    // 공지사항 섹션이 표시되지 않거나 공지 내용이 없어야 함
    const noticeSection = page.getByRole('heading', { name: '공지사항' });
    const noticeText = page.getByText(noticeContent);

    // waitlist 사용자는 공지사항을 볼 수 없음
    await expect(noticeSection).not.toBeVisible({ timeout: 5000 });
    await expect(noticeText).not.toBeVisible({ timeout: 5000 });
  });
});
