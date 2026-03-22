import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Playwright E2E 테스트 설정
 *
 * 핵심 사용자 플로우를 검증하는 E2E 테스트 구성입니다.
 * - 이벤트 생성 → 참가 신청 → 공지사항 확인
 * - 정원 초과 waitlist 및 자동 승격
 * - 권한 검증 (미인증/비주최자/waitlist 사용자)
 */
export default defineConfig({
  // 글로벌 셋업: 테스트 유저 사전 생성
  globalSetup: './tests/global-setup.ts',

  // 테스트 파일 위치
  testDir: './tests/e2e',

  // 전체 테스트 제한 시간 (ms)
  timeout: 60000,

  // 실패 시 재시도 없음 (원인 파악 우선)
  retries: 0,

  // 병렬 실행 비활성화 (Supabase 공유 DB 상태 충돌 방지)
  workers: 1,
  fullyParallel: false,

  // 테스트 결과 리포트
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // 스크린샷 및 비디오 저장 (실패 시)
  use: {
    // 기본 URL (개발 서버)
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',

    // 실패 시 스크린샷 저장
    screenshot: 'only-on-failure',

    // 실패 시 비디오 저장
    video: 'retain-on-failure',

    // 실패 시 트레이스 저장 (디버깅용)
    trace: 'retain-on-failure',

    // 각 테스트마다 새로운 브라우저 컨텍스트 (세션 격리)
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 개발 서버 자동 시작 (선택 사항, 이미 실행 중인 경우 주석 처리)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120000,
  // },
});
