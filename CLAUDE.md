# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js 15와 Supabase를 사용한 풀스택 스타터 킷입니다. Next.js App Router 기반의 모던 웹 애플리케이션으로 Server Components, Supabase Auth를 활용한 인증, 프로필 관리 등의 기능을 포함합니다.

## 주요 기술 스택

- **프레임워크**: Next.js (최신버전, App router)
- **인증/데이터베이스**: Supabase (@supabase/ssr, @supabase/supabase-js)
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui (new-york 스타일, Radix UI 기반)
- **테마**: next-themes (다크 모드 지원)
- **아이콘**: Lucide React
- **타입스크립트**: 엄격 모드 활성화

## 개발 환경 및 스크립트

### 자주 사용되는 명령어

```bash
npm run dev          # 개발 서버 시작 (localhost:3000)
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 서버 시작
npm run lint         # ESLint를 사용한 코드 검사
```

## 프로젝트 구조

### 핵심 디렉토리

- **`app/`** - Next.js App Router 기반 페이지 및 레이아웃
  - `auth/` - 인증 관련 페이지 (로그인, 회원가입, 비밀번호 변경)
  - `protected/` - 인증이 필요한 페이지
  - `layout.tsx` - 루트 레이아웃 (ThemeProvider 포함)

- **`components/`** - React 컴포넌트
  - UI 컴포넌트 (shadcn/ui 기반)
  - 폼 컴포넌트 (로그인, 회원가입)
  - 인증 관련 컴포넌트

- **`lib/`** - 유틸리티 및 설정
  - `supabase/` - Supabase 클라이언트 설정
    - `client.ts` - 브라우저용 Supabase 클라이언트
    - `server.ts` - 서버 컴포넌트용 Supabase 클라이언트
    - `proxy.ts` - API 라우트용 프록시
    - `types.ts` - TypeScript 타입 정의
  - `actions/` - Server Actions
    - `profile.ts` - 프로필 관련 작업
  - `utils.ts` - 유틸리티 함수 (cn, hasEnvVars)

### 중요한 설정 파일

- **`components.json`** - shadcn/ui 설정 (alias, style, RSC 활성화)
- **`tailwind.config.ts`** - Tailwind CSS 설정
- **`tsconfig.json`** - TypeScript 컴파일러 옵션 (경로 alias: `@/*`)
- **`next.config.ts`** - Next.js 설정 (cacheComponents 활성화)

## 아키텍처 핵심 개념

### 인증 시스템 (Supabase SSR)

- **쿠키 기반 세션 관리**: `@supabase/ssr` 패키지 사용
- **클라이언트/서버 분리**:
  - `lib/supabase/client.ts` - 클라이언트 컴포넌트에서 사용
  - `lib/supabase/server.ts` - 서버 컴포넌트/Server Actions에서 사용
  - 각 함수 호출 시마다 새로운 클라이언트 인스턴스 생성 (Fluid Compute 권장사항)

- **라우트 보호**:
  - `app/protected/layout.tsx` - 인증된 사용자만 접근 가능
  - Middleware를 통한 세션 검증

### UI 및 스타일링

- **shadcn/ui**: 헤드리스 UI 컴포넌트 라이브러리
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **next-themes**: 다크/라이트 모드 지원
- **클래스 유틸**: `cn()` 함수로 조건부 클래스 병합 (clsx + tailwind-merge)

### Server Actions

- `lib/actions/` 디렉토리에 서버 액션 정의
- 폼 제출, 데이터 변경 등의 작업 처리
- 클라이언트에서 직접 서버 함수 호출 가능

## 개발 관례

### 경로 별칭 (Path Aliases)

- `@/` 루트 디렉토리를 기준으로 절대 경로 사용
- 예: `@/components/ui/button`, `@/lib/supabase/server`

### 컴포넌트 작성

- **클라이언트 컴포넌트**: `'use client'` 지시문 사용
- **서버 컴포넌트**: 기본값 (보안, 성능 이점)
- **타입**: TypeScript 사용 (strict mode 활성화)

### 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase 공개 키
- `.env.local` 파일에 설정 (git ignore 대상)

## 자주 수정하는 파일 패턴

### 새 페이지 추가

1. `app/[route]/page.tsx` 또는 `app/[route]/layout.tsx` 생성
2. 서버 컴포넌트 기본, 필요시 `'use client'` 추가
3. Supabase 클라이언트 필요시 `lib/supabase/server.ts` import

### 새 Server Action 추가

1. `lib/actions/[feature].ts`에 함수 정의
2. 함수 맨 위에 `'use server'` 지시문 추가
3. Supabase 서버 클라이언트로 데이터 처리

### UI 컴포넌트 추가

```bash
npx shadcn-ui@latest add [component-name]
```

기존 컴포넌트는 `components/ui/` 디렉토리에 위치합니다.
