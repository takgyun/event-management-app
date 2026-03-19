# Phase 2-8: 반응형 디자인 + 접근성

## 목표

모든 컴포넌트를 320px~1440px 해상도에서 완벽하게 작동하도록 최적화하고, WCAG 2.1 Level AA 접근성 표준을 충족합니다.

---

## 수정 대상 파일

### `components/layout/app-header.tsx`

**변경 사항**: 모바일 햄버거 메뉴 추가

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b sticky top-0 z-40 bg-background">
      <nav className="container flex items-center justify-between py-4">
        {/* 로고 */}
        <Link
          href="/"
          className="text-xl font-bold"
          aria-label="EventHub 홈페이지"
        >
          EventHub
        </Link>

        {/* 데스크톱 메뉴 (md 이상) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/events"
            className="hover:text-primary transition"
            aria-current="page"
          >
            이벤트
          </Link>
          <Link
            href="/protected/dashboard"
            className="hover:text-primary transition"
          >
            대시보드
          </Link>
          <Link
            href="/auth/logout"
            className="hover:text-primary transition"
          >
            로그아웃
          </Link>
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-4">
          <ThemeToggle aria-label="테마 변경" />

          {/* 모바일 토글 버튼 (md 미만) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* 모바일 메뉴 (md 미만) */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t bg-muted/50 p-4 space-y-3"
          role="navigation"
          aria-label="모바일 네비게이션"
        >
          <Link
            href="/events"
            className="block py-2 px-3 hover:bg-muted rounded transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            이벤트
          </Link>
          <Link
            href="/protected/dashboard"
            className="block py-2 px-3 hover:bg-muted rounded transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            대시보드
          </Link>
          <Link
            href="/auth/logout"
            className="block py-2 px-3 hover:bg-muted rounded transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            로그아웃
          </Link>
        </div>
      )}
    </header>
  );
}
```

**주요 변경 사항**:
1. `useState(mobileMenuOpen)` - 모바일 메뉴 상태 관리
2. `hidden md:flex` - 데스크톱에서만 메뉴 표시
3. `md:hidden` 토글 버튼 - 모바일에서만 표시
4. ARIA 속성: `aria-expanded`, `aria-controls`, `aria-label`

---

## 반응형 디자인 체크리스트

### Tailwind Breakpoints 사용
```
sm: 640px
md: 768px    ← 주요 breakpoint (모바일 ↔ 데스크톱)
lg: 1024px
xl: 1280px
```

### 핵심 컴포넌트별 반응형 검증

#### 1. 헤더 (`app-header.tsx`)
- [ ] 320px: 햄버거 메뉴 표시, 로고만 보임
- [ ] 768px (md): 네비게이션 메뉴 표시, 햄버거 메뉴 숨김
- [ ] 1440px: 전체 레이아웃 균형

#### 2. 이벤트 카드 (`event-card.tsx`)
```typescript
// 기존 코드 검증
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <EventCard />
</div>
```
- [ ] 320px: 1열 (full-width, padding 적용)
- [ ] 768px: 2열
- [ ] 1024px 이상: 3열

#### 3. 폼 컴포넌트 (`event-form.tsx`)
```typescript
// 날짜/시간 입력
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input type="date" />
  <Input type="time" />
</div>
```
- [ ] 320px: 세로 정렬 (1열)
- [ ] 640px 이상: 가로 정렬 (2열)

#### 4. 참가자 목록 (`participant-list.tsx`)
```typescript
// 참가자 아이템
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
  <div className="flex-1">
    {/* 참가자 정보 */}
  </div>
  <div className="w-full sm:w-auto">
    {/* 액션 버튼 */}
  </div>
</div>
```
- [ ] 320px: 세로 정렬, 버튼 full-width
- [ ] 640px 이상: 가로 정렬, 버튼 fixed-width

#### 5. 공지사항 폼 (`notice-form.tsx`)
```typescript
// textarea 반응형
<Textarea
  rows={4}
  className="resize-none"
/>
```
- [ ] 모든 해상도: textarea는 고정 높이 (resize 불가)

---

## ARIA 접근성 검증

### 1. 라벨 및 설명

#### 폼 입력 필드
```typescript
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="title">제목 *</FormLabel>
      <FormControl>
        <Input
          id="title"
          placeholder="..."
          aria-required="true"
          aria-describedby="title-error"
          {...field}
        />
      </FormControl>
      <FormMessage id="title-error" role="alert" />
    </FormItem>
  )}
/>
```

- [ ] `<label>` with `htmlFor` 연결
- [ ] `aria-required="true"` (필수 필드)
- [ ] `aria-describedby` (에러 메시지)
- [ ] `<FormMessage role="alert">` (스크린 리더)

#### 버튼
```typescript
<Button
  onClick={handleAction}
  aria-label="참가신청 (남은 자리 5명)"
  disabled={isLoading}
>
  참가신청
</Button>
```

- [ ] `aria-label` (동작 설명, 필요시)
- [ ] `disabled` 상태
- [ ] 로딩 중 `aria-busy="true"`

#### 다이얼로그
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">로그인 필요</DialogTitle>
      <DialogDescription id="dialog-description">
        이 기능을 사용하려면 로그인이 필요합니다.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

- [ ] `aria-labelledby` (제목 연결)
- [ ] `aria-describedby` (설명 연결)
- [ ] 포커스 트랩 (자동, shadcn/ui)

### 2. 상태 표시

#### 로딩 상태
```typescript
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? '로딩 중...' : '제출'}
</Button>
```

- [ ] `aria-busy="true"` (비동기 작업 중)
- [ ] 버튼 텍스트 변경 ("제출" → "로딩 중...")

#### 탭 인터페이스
```typescript
<Tabs defaultValue="confirmed">
  <TabsList role="tablist">
    <TabsTrigger value="confirmed" role="tab" aria-selected={value === 'confirmed'}>
      확정 ({count})
    </TabsTrigger>
  </TabsList>
</Tabs>
```

- [ ] `role="tablist"`, `role="tab"`
- [ ] `aria-selected` (활성 탭 표시)

#### 배지
```typescript
<Badge aria-label="이벤트 상태: 모집 중">
  모집 중
</Badge>
```

- [ ] `aria-label` (배지 의미 설명)

### 3. 강의성 (Skip Links)

```typescript
// app/layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only"
>
  메인 콘텐츠로 이동
</a>

<main id="main-content">
  {/* 페이지 콘텐츠 */}
</main>
```

- [ ] Skip link 구현 (sr-only 클래스)
- [ ] `id="main-content"` with `<main>`

---

## 포커스 및 키보드 네비게이션

### 포커스 스타일
```css
/* tailwind: focus-visible */
button {
  @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
}
```

**검증**:
- [ ] Tab 키로 모든 인터랙티브 요소 이동 가능
- [ ] Shift+Tab 역방향 이동
- [ ] Enter 키로 버튼 활성화
- [ ] Space 키로 체크박스/라디오 전환
- [ ] Escape 키로 다이얼로그 닫기
- [ ] 포커스 표시 (outline) 명확함 (min 2px)

### 다이얼로그 포커스 관리
```typescript
// shadcn Dialog는 자동으로 포커스 트랩 + 초기 포커스 설정
<DialogContent>
  {/* 첫 interactive element에 자동 포커스 */}
</DialogContent>
```

- [ ] 다이얼로그 열기 → 첫 버튼에 포커스
- [ ] 다이얼로그 닫기 → 이전 포커스 위치로 복구

---

## 색상 대비 (WCAG AA 이상)

### 검증 항목

```
텍스트 색상 대비: 4.5:1 (일반 텍스트)
큰 텍스트 색상 대비: 3:1 (18pt 이상)
UI 컴포넌트 색상 대비: 3:1 (경계, 백그라운드)
```

**검증 도구**:
- WebAIM Contrast Checker
- axe DevTools (브라우저 확장)

**검증 항목**:
- [ ] 검은색 텍스트 on 흰색 배경: 21:1 ✓
- [ ] 회색 텍스트 (text-muted-foreground) on 흰색: 4.5:1 이상
- [ ] 버튼 배경색 vs 텍스트 색상: 4.5:1 이상
- [ ] 다크 모드 색상 조합 검증

---

## 반응형 폰트 크기

```typescript
// tailwind 클래스 사용
<h1 className="text-2xl sm:text-3xl md:text-4xl">제목</h1>
<p className="text-sm sm:text-base">본문</p>
```

**검증**:
- [ ] 320px: 기본 텍스트 읽기 가능 (최소 16px)
- [ ] 모바일: 줄 길이 < 50-75자
- [ ] 데스크톱: 모든 텍스트 명확하게 읽힘

---

## 이미지 접근성

```typescript
<img
  src="/event-image.jpg"
  alt="2025 개발자 컨퍼런스 - 서울 강남, 3월 25일"
  className="w-full h-48 object-cover rounded"
/>
```

**검증**:
- [ ] 모든 `<img>`에 `alt` 텍스트
- [ ] `alt`는 이미지 내용 설명 (최대 150자)
- [ ] 장식용 이미지: `alt=""` + `aria-hidden="true"`

---

## 다크 모드 검증

```typescript
// tailwind dark: 지원 확인
<div className="bg-white dark:bg-slate-950 text-black dark:text-white">
  {/* 내용 */}
</div>
```

**검증 항목**:
- [ ] 라이트 모드: 흰색 배경, 검은 텍스트
- [ ] 다크 모드: 진한 배경, 밝은 텍스트
- [ ] 모든 컴포넌트에서 색상 대비 4.5:1 이상 유지

**CSS 변수 사용 (권장)**:
```typescript
// app/layout.tsx에서 확인
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider defaultTheme="system">
  {children}
</ThemeProvider>
```

---

## 스크린 리더 검증

**사용할 스크린 리더**:
- Windows: NVDA (무료)
- macOS: VoiceOver (기본)
- 브라우저: axe DevTools

**검증 항목**:
- [ ] 헤더 읽음: "EventHub 배너 영역"
- [ ] 네비게이션 읽음: "메뉴, 네비게이션, 3개 항목"
- [ ] 버튼 읽음: "참가신청 버튼" (aria-label)
- [ ] 폼 필드 읽음: "제목, 편집 가능 텍스트, 필수"
- [ ] 에러 읽음: "알림, 제목은 필수입니다."

---

## 자동화 도구 실행

### axe DevTools (브라우저 확장)
```
설치: Chrome/Firefox에서 "axe DevTools" 검색 후 설치
실행: F12 → axe DevTools 탭 → "Scan ALL of my page"
```

**예상 결과**:
- [ ] 0개 Critical 오류
- [ ] 0개 Serious 오류
- [ ] 5개 이상 Best Practices 적용

### Lighthouse (Chrome DevTools)
```
F12 → Lighthouse → "Accessibility" 탭 → "Analyze page load"
```

**기준**:
- [ ] Accessibility 점수 90점 이상

---

## 최종 검증 체크리스트

### 반응형
- [ ] 320px 모바일 해상도 완벽 작동
- [ ] 768px 태블릿 전환점 (md) 확인
- [ ] 1440px 데스크톱 레이아웃 균형
- [ ] 모든 이미지 반응형 (object-cover, w-full)
- [ ] 폼 입력 필드 모바일 친화적 (적절한 padding, 터치 영역)

### 접근성
- [ ] ARIA 라벨 모든 폼 필드 적용
- [ ] 포커스 표시 명확 (outline 2px 이상)
- [ ] Tab 키로 모든 인터랙티브 요소 접근 가능
- [ ] 색상 대비 4.5:1 이상 (텍스트)
- [ ] 다크 모드 색상 대비 유지
- [ ] 이미지 alt 텍스트 완성
- [ ] 스크린 리더 테스트 통과 (NVDA 또는 VoiceOver)
- [ ] axe DevTools 0개 Critical/Serious 오류
- [ ] Lighthouse Accessibility 90점 이상

### 빌드 및 배포
- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] 프로덕션 빌드 최적화 확인

---

## 참고 자료

### WCAG 2.1 가이드
- [WAI-ARIA 작성 사례](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

### Tailwind CSS 접근성
- [Tailwind Accessibility](https://tailwindcss.com/docs/visibility)
- `sr-only`: 스크린 리더만 표시
- `focus-visible`: 포커스 표시 (마우스 사용자는 숨김)

### shadcn/ui 접근성
- 모든 컴포넌트 Radix UI 기반 (WCAG 준수)
- Dialog, Tabs 등에 자동 ARIA 적용
