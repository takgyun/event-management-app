# P1-1.2 레이아웃 컴포넌트 및 구조 설계

## 개요

스타터킷의 인라인 네비게이션과 푸터를 제거하고, 재사용 가능한 `AppHeader`, `AppFooter` 컴포넌트로 통합합니다.

## AppHeader 컴포넌트

**파일:** `components/layout/app-header.tsx`
**타입:** 서버 컴포넌트

### 구성 요소

```
┌─────────────────────────────────────────────────────┐
│  [로고] 모임 이벤트  |  이벤트 목록  대시보드  |  [인증]  [테마]  │
└─────────────────────────────────────────────────────┘
```

### 상세 명세

1. **로고 및 앱 이름**
   - 텍스트: "모임 이벤트"
   - 링크: `/` (홈)
   - 스타일: bold, 앱 이름 강조

2. **네비게이션 링크**
   - "이벤트 목록" → `/events` (공개 라우트)
   - "대시보드" → `/protected/dashboard` (인증 필요)

3. **인증 버튼**
   - `AuthButton` 컴포넌트 재사용
   - **Suspense 래핑 필수** (서버 컴포넌트이므로 비동기 처리)
   - `hasEnvVars()` 확인:
     - `false` → `EnvVarWarning` 표시
     - `true` → `AuthButton` 표시

4. **테마 전환 버튼**
   - `ThemeSwitcher` 컴포넌트 재사용

### 재사용 컴포넌트 (import 필수)

```typescript
import { AuthButton } from '@/components/auth-button'
import { EnvVarWarning } from '@/components/env-var-warning'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { hasEnvVars } from '@/lib/utils'
import { Suspense } from 'react'
import Link from 'next/link'
```

### CSS 클래스 구조 (Tailwind)

```
- 전체: flex, items-center, justify-between, px-4, py-3, border-b
- 로고: font-bold, text-lg, text-foreground
- 네비게이션: flex, gap-4, text-sm
- 오른쪽: flex, gap-2, items-center
```

## AppFooter 컴포넌트

**파일:** `components/layout/app-footer.tsx`
**타입:** 서버 컴포넌트

### 구성 요소

```
┌─────────────────────────────────────────────────────┐
│           모임 이벤트 | © 2026  |  [테마]             │
└─────────────────────────────────────────────────────┘
```

### 상세 명세

1. **앱 이름**
   - 텍스트: "모임 이벤트"

2. **저작권 표시**
   - 텍스트: "© 2026"
   - 스타일: 텍스트 크기 작음, 회색 (text-muted-foreground)

3. **테마 전환 버튼**
   - `ThemeSwitcher` 컴포넌트 재사용

### CSS 클래스 구조 (Tailwind)

```
- 전체: flex, items-center, justify-center, gap-4, px-4, py-4, border-t, text-sm, text-muted-foreground
```

## (public) Route Group 레이아웃

**파일:** `app/(public)/layout.tsx`

### 목적

공개 라우트(`/`, `/events`, `/events/[id]`)에 `AppHeader`와 `AppFooter`를 일관되게 적용합니다.

### 구조

```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  )
}
```

### CSS 레이아웃 설명

- `flex flex-col` — 세로 방향 레이아웃
- `min-h-screen` — 최소 높이 100vh (뷰포트 높이)
- `AppHeader` — 상단 고정
- `<main>` — `flex-1` (남은 공간 차지, footer를 하단에 배치)
- `AppFooter` — 하단 고정

## protected 레이아웃 수정

**파일:** `app/protected/layout.tsx`

### 변경 내용

1. **제거할 요소**
   - 인라인 네비게이션 코드
   - 인라인 푸터 코드
   - `DeployButton` import 및 사용
   - `EnvVarWarning` 인라인 표시

2. **추가할 요소**
   - `AppHeader` 컴포넌트 import 및 상단 배치
   - `AppFooter` 컴포넌트 import 및 하단 배치
   - `flex flex-col min-h-screen` 레이아웃 구조

3. **유지할 요소**
   - Supabase 인증 미들웨어 로직 (세션 검증)
   - `children` 렌더링

### 기본 구조

```typescript
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  )
}
```

## 정리: app/layout.tsx 메타데이터 변경 사항

**파일:** `app/layout.tsx` (루트 레이아웃)

### 변경 내용

```typescript
export const metadata: Metadata = {
  title: '모임 이벤트 관리',
  description: '소규모 모임 이벤트 관리 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">  {/* 기존: lang="en" */}
      <body>
        {children}
      </body>
    </html>
  )
}
```

## 주의 사항

- **AppHeader/AppFooter는 서버 컴포넌트** — 비동기 작업 가능
- **AuthButton은 클라이언트 컴포넌트** — AppHeader에서 Suspense로 래핑
- **(public) 레이아웃과 protected 레이아웃은 독립적** — 각각의 Route Group 구조 유지
- **스타일 일관성** — 두 레이아웃의 CSS 구조 동일 유지 (flex-col, min-h-screen)
