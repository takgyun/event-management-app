import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasEnvVars } from '../utils';

/**
 * Supabase 세션 갱신 프록시 함수
 *
 * 역할: 모든 요청에서 Supabase 세션을 자동으로 갱신합니다.
 * - getClaims()를 호출하여 세션 토큰 유효성 검사 및 갱신
 * - 갱신된 쿠키를 응답에 설정
 *
 * 참고: 라우트 보호 로직은 app/protected/layout.tsx에서 처리합니다.
 * 이 함수는 세션 갱신 역할에만 집중합니다.
 *
 * IMPORTANT: Fluid compute 환경에서 전역 변수에 클라이언트를 저장하지 마세요.
 * 매 요청마다 새로운 클라이언트 인스턴스를 생성해야 합니다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 환경 변수 미설정 시 프록시 건너뜀 (초기 설정 전 단계)
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Supabase 서버 클라이언트 생성 (매 요청마다 새로운 인스턴스)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // 요청에서 모든 쿠키 읽기
        getAll() {
          return request.cookies.getAll();
        },
        // 응답에 갱신된 쿠키 설정
        setAll(cookiesToSet) {
          // 먼저 요청 쿠키 업데이트
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 새 응답 생성 후 쿠키 적용
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 자동 갱신 - getClaims()는 서버에서 토큰을 검증하고 필요시 갱신
  // IMPORTANT: createServerClient와 getClaims() 사이에 코드를 추가하지 마세요.
  // 사용자가 무작위로 로그아웃되는 문제가 발생할 수 있습니다.
  await supabase.auth.getClaims();

  // IMPORTANT: supabaseResponse 객체를 그대로 반환해야 합니다.
  // 새로운 NextResponse.next()를 생성하는 경우:
  // 1. request를 전달: NextResponse.next({ request })
  // 2. 쿠키 복사: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. 쿠키는 수정하지 않음
  // 이를 지키지 않으면 브라우저와 서버가 동기화되지 않아 세션이 조기 종료될 수 있습니다.
  return supabaseResponse;
}
