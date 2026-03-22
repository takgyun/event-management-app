import { Page } from '@playwright/test';

/**
 * E2E 테스트 공통 헬퍼 함수 모음
 *
 * 반복되는 사용자 인터랙션(회원가입, 로그인, 이벤트 생성 등)을
 * 재사용 가능한 함수로 추상화합니다.
 */

// ============================================================
// 인증 헬퍼
// ============================================================

/**
 * 고유한 타임스탬프 기반 테스트 이메일 생성
 * 각 테스트마다 새로운 사용자 계정을 사용하여 격리합니다.
 */
export function generateTestEmail(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix}+${timestamp}@test.example.com`;
}

/**
 * 로그인 수행
 *
 * @param page - Playwright 페이지 객체
 * @param email - 로그인 이메일
 * @param password - 비밀번호
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  // 이메일 입력
  await page.getByLabel('이메일').fill(email);

  // 비밀번호 입력
  await page.getByLabel('비밀번호').fill(password);

  // 로그인 버튼 클릭
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // 대시보드로 이동 대기
  await page.waitForURL(/protected\/dashboard/, { timeout: 15000 });
}

/**
 * 회원가입 수행
 *
 * 먼저 로그인을 시도하고, 실패하면 회원가입을 진행합니다.
 * (이메일 rate limit 및 이미 존재하는 계정 처리)
 *
 * @param page - Playwright 페이지 객체
 * @param email - 회원가입 이메일
 * @param password - 비밀번호
 */
export async function signUp(page: Page, email: string, password: string): Promise<void> {
  // 1단계: 먼저 로그인 시도
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  try {
    await page.waitForURL(/protected\/dashboard/, { timeout: 5000 });
    // 로그인 성공: 계정이 이미 존재함
    return;
  } catch {
    // 로그인 실패: 신규 계정 생성 필요
  }

  // 2단계: 회원가입
  await page.goto('/auth/sign-up');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('이메일').fill(email);

  // 비밀번호 입력 (첫 번째 필드)
  const passwordInputs = page.getByLabel('비밀번호');
  await passwordInputs.first().fill(password);

  // 비밀번호 확인 필드
  await page.locator('#repeat-password').fill(password);

  // 회원가입 버튼 클릭 (exact: true로 "Google로 회원가입" 버튼과 구분)
  await page.getByRole('button', { name: '회원가입', exact: true }).click();

  // 회원가입 성공 페이지 또는 대시보드 대기
  await page.waitForURL(/sign-up-success|dashboard|protected/, { timeout: 15000 });
}

/**
 * 로그아웃 수행
 *
 * @param page - Playwright 페이지 객체
 */
export async function signOut(page: Page): Promise<void> {
  // 로그아웃 버튼 찾기 (헤더 또는 네비게이션에 위치)
  const logoutButton = page.getByRole('button', { name: /로그아웃|Logout/i });

  if (await logoutButton.count() > 0) {
    await logoutButton.first().click();
  } else {
    // 드롭다운 메뉴에서 로그아웃 찾기
    const userMenu = page.getByRole('button', { name: /계정|프로필|user/i });
    if (await userMenu.count() > 0) {
      await userMenu.first().click();
      await page.getByRole('menuitem', { name: /로그아웃/i }).click();
    } else {
      // 직접 로그아웃 액션 링크 클릭
      await page.getByRole('link', { name: /로그아웃/i }).click();
    }
  }

  // 홈 또는 로그인 페이지로 이동 대기
  await page.waitForURL(/auth\/login|\/$/, { timeout: 10000 });
}

// ============================================================
// 이벤트 생성 헬퍼
// ============================================================

/**
 * 이벤트 생성 수행
 *
 * @param page - Playwright 페이지 객체
 * @param options - 이벤트 정보
 * @returns 생성된 이벤트 ID
 */
export async function createEvent(
  page: Page,
  options: {
    title: string;
    description?: string;
    location?: string;
    maxCapacity?: number;
    daysFromNow?: number;
  }
): Promise<string> {
  await page.goto('/protected/events/new');
  await page.waitForLoadState('networkidle');

  // 제목 입력
  await page.getByLabel('이벤트 제목').fill(options.title);

  // 설명 입력 (선택)
  if (options.description) {
    await page.getByLabel('이벤트 설명').fill(options.description);
  }

  // 날짜/시간 설정 (현재로부터 n일 후)
  const daysFromNow = options.daysFromNow ?? 7;
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + daysFromNow);
  eventDate.setHours(14, 0, 0, 0);
  // datetime-local 형식: YYYY-MM-DDTHH:mm
  const dateStr = eventDate.toISOString().slice(0, 16);
  await page.getByLabel('이벤트 날짜/시간').fill(dateStr);

  // 장소 입력
  await page.getByLabel('장소').fill(options.location ?? '서울 강남구 테스트 장소');

  // 최대 정원 입력
  await page.getByLabel('최대 정원').fill(String(options.maxCapacity ?? 10));

  // 이벤트 만들기 버튼 클릭
  await page.getByRole('button', { name: '이벤트 만들기' }).click();

  // 관리 페이지로 이동 대기 (URL에 eventId 포함)
  await page.waitForURL(/\/protected\/events\/[a-z0-9-]+\/manage/, { timeout: 20000 });

  // URL에서 이벤트 ID 추출
  const url = page.url();
  const match = url.match(/\/events\/([a-z0-9-]+)\/manage/);
  if (!match) {
    throw new Error(`이벤트 ID를 URL에서 추출할 수 없습니다: ${url}`);
  }

  return match[1];
}

// ============================================================
// 참가 신청 헬퍼
// ============================================================

/**
 * 이벤트 상세 페이지에서 참가 신청 수행
 *
 * @param page - Playwright 페이지 객체
 * @param eventId - 이벤트 UUID
 */
export async function applyToEvent(page: Page, eventId: string): Promise<void> {
  await page.goto(`/events/${eventId}`);
  await page.waitForLoadState('networkidle');

  // 참가 신청 버튼 대기 및 클릭
  const applyButton = page.getByTestId('apply-button');
  await applyButton.waitFor({ state: 'visible', timeout: 10000 });
  await applyButton.click();

  // 상태 변경 대기 (confirmed 또는 waitlist)
  await page.waitForFunction(
    () => {
      const confirmed = document.querySelector('[data-testid="participation-status-confirmed"]');
      const waitlist = document.querySelector('[data-testid="participation-status-waitlist"]');
      return confirmed !== null || waitlist !== null;
    },
    { timeout: 15000 }
  );
}

/**
 * 참가 취소 수행
 *
 * @param page - Playwright 페이지 객체
 * @param eventId - 이벤트 UUID
 */
export async function cancelEventParticipation(page: Page, eventId: string): Promise<void> {
  await page.goto(`/events/${eventId}`);
  await page.waitForLoadState('networkidle');

  // 취소 버튼 (참가 취소 또는 대기 취소)
  const cancelButton = page
    .getByTestId('cancel-button')
    .or(page.getByTestId('cancel-waitlist-button'));
  await cancelButton.first().waitFor({ state: 'visible', timeout: 10000 });
  await cancelButton.first().click();

  // 신청 버튼이 다시 나타날 때까지 대기
  await page.getByTestId('apply-button').waitFor({ state: 'visible', timeout: 15000 });
}
