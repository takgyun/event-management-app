import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // cacheComponents는 실험적 기능으로 cookies()를 Suspense 외부에서 사용할 수 없게 제한합니다.
  // 인증이 필요한 레이아웃 및 페이지가 많은 이 프로젝트에서는 비활성화합니다.
  // cacheComponents: true,
};

export default nextConfig;
