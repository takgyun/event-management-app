/**
 * E2E 테스트용 고정 테스트 계정
 *
 * global-setup.ts에서 미리 생성되는 계정들입니다.
 * Supabase 대시보드 > Authentication > Settings에서 이메일 확인을 비활성화하거나,
 * SUPABASE_SERVICE_ROLE_KEY 환경 변수를 설정하면 자동으로 계정이 생성됩니다.
 */

export const TEST_PASSWORD = 'TestPass123!';

export const TEST_ACCOUNTS = {
  /** 이벤트 주최자 A */
  hostA: {
    email: 'e2e-host-a@test.example.com',
    password: TEST_PASSWORD,
  },
  /** 이벤트 주최자 B */
  hostB: {
    email: 'e2e-host-b@test.example.com',
    password: TEST_PASSWORD,
  },
  /** 참가자 A */
  participantA: {
    email: 'e2e-participant-a@test.example.com',
    password: TEST_PASSWORD,
  },
  /** 참가자 B */
  participantB: {
    email: 'e2e-participant-b@test.example.com',
    password: TEST_PASSWORD,
  },
  /** 참가자 C (웨이트리스트 테스트용) */
  participantC: {
    email: 'e2e-participant-c@test.example.com',
    password: TEST_PASSWORD,
  },
  /** 권한 없는 사용자 */
  unauthorized: {
    email: 'e2e-unauthorized@test.example.com',
    password: TEST_PASSWORD,
  },
} as const;
