# P1-1.2 페이지 골격 생성 계획

## 라우트 구조 개요

```
app/
├── layout.tsx                          # 루트 레이아웃 (메타데이터, lang="ko")
├── (public)/                           # 공개 라우트 그룹
│   ├── layout.tsx                      # AppHeader + AppFooter
│   ├── page.tsx                        # 홈 페이지
│   └── events/
│       ├── page.tsx                    # 이벤트 목록 (공개)
│       └── [id]/
│           └── page.tsx                # 이벤트 상세 (공개)
├── protected/                          # 인증 필수 라우트
│   ├── layout.tsx                      # 세션 검증, AppHeader + AppFooter
│   ├── page.tsx                        # 기본 페이지 (유지)
│   ├── profile/                        # 프로필 (기존, 유지)
│   ├── dashboard/
│   │   └── page.tsx                    # 대시보드
│   └── events/
│       ├── new/
│       │   └── page.tsx                # 이벤트 생성
│       └── [id]/
│           ├── edit/
│           │   └── page.tsx            # 이벤트 수정
│           └── manage/
│               └── page.tsx            # 이벤트 관리
└── auth/                               # 인증 페이지 (기존, 유지)
```

## URL 매핑 테이블

| URL                          | 파일 위치                                    | 접근 권한  | 설명                |
|------------------------------|----------------------------------------------|----------|---------------------|
| `/`                          | `app/(public)/page.tsx`                      | 공개     | 홈 페이지            |
| `/events`                    | `app/(public)/events/page.tsx`               | 공개     | 이벤트 목록          |
| `/events/[id]`               | `app/(public)/events/[id]/page.tsx`          | 공개     | 이벤트 상세          |
| `/protected`                 | `app/protected/page.tsx`                     | 인증 필요 | 기본 페이지 (기존)   |
| `/protected/profile`         | `app/protected/profile/page.tsx`             | 인증 필요 | 프로필 (기존)        |
| `/protected/dashboard`       | `app/protected/dashboard/page.tsx`           | 인증 필요 | 대시보드             |
| `/protected/events/new`      | `app/protected/events/new/page.tsx`          | 인증 필요 | 이벤트 생성          |
| `/protected/events/[id]/edit`| `app/protected/events/[id]/edit/page.tsx`    | 인증 필요 | 이벤트 수정          |
| `/protected/events/[id]/manage`| `app/protected/events/[id]/manage/page.tsx`  | 인증 필요 | 이벤트 관리/참가자   |

## 페이지별 상세 명세

### 1. 홈 페이지 (`app/(public)/page.tsx`)

**목적:** 앱 소개 및 진입점

**구성 요소:**
- 제목: "모임 이벤트 관리"
- 설명: "소규모 모임 및 커뮤니티 이벤트를 쉽게 관리하세요"
- 버튼 1: "이벤트 보기" → `/events`
- 버튼 2: "이벤트 만들기" → `/protected/events/new`
- 스타일: 중앙 정렬, 큰 텍스트, 여백 충분

**특징:**
- 스타터킷 요소 제거 (DeployButton, Hero, ConnectSupabaseSteps, SignUpUserSteps)
- 인라인 네비게이션 제거 (AppHeader에서 처리)
- 간결하고 명확한 메시지

**코드 구조 예시:**
```typescript
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <h1 className="text-4xl font-bold mb-4">모임 이벤트 관리</h1>
      <p className="text-xl text-muted-foreground mb-8">
        소규모 모임 및 커뮤니티 이벤트를 쉽게 관리하세요
      </p>
      <div className="flex gap-4">
        <Link href="/events">이벤트 보기</Link>
        <Link href="/protected/events/new">이벤트 만들기</Link>
      </div>
    </div>
  )
}
```

### 2. 이벤트 목록 (`app/(public)/events/page.tsx`)

**목적:** 진행 중인 이벤트 목록 표시

**구성 요소:**
- 제목: "이벤트 목록"
- 안내 텍스트: "(더미 데이터는 Phase 2에서 추가 예정)"
- 이벤트 카드 플레이스홀더 (그리드 또는 리스트)
- "이벤트 만들기" 링크

**데이터:**
- Phase 2에서 Supabase 연동 예정
- 현재는 UI 골격만 구현

**코드 구조 예시:**
```typescript
export default function EventsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">이벤트 목록</h1>
      <p className="text-muted-foreground">
        (더미 데이터는 Phase 2에서 추가 예정)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 이벤트 카드 플레이스홀더 */}
      </div>
    </div>
  )
}
```

### 3. 이벤트 상세 (`app/(public)/events/[id]/page.tsx`)

**목적:** 특정 이벤트의 상세 정보 표시

**구성 요소:**
- 페이지 제목: "이벤트 상세"
- 파라미터 표시: "ID: {id}"
- 안내 텍스트: "(Phase 2에서 UI 구현 예정)"
- "돌아가기" 링크 → `/events`

**파라미터:**
- `id: string` — 이벤트 ID

**코드 구조 예시:**
```typescript
export default function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-4">
      <a href="/events" className="text-sm text-blue-500">
        ← 돌아가기
      </a>
      <h1 className="text-3xl font-bold">이벤트 상세</h1>
      <p className="text-muted-foreground">
        ID: {params.id}
      </p>
      <p className="text-muted-foreground">
        (Phase 2에서 UI 구현 예정)
      </p>
    </div>
  )
}
```

### 4. 대시보드 (`app/protected/dashboard/page.tsx`)

**목적:** 사용자가 주최/참가하는 이벤트 대시보드

**접근 권한:** 인증 필요 (protected 레이아웃이 처리)

**구성 요소:**
- 제목: "대시보드"
- 섹션 1: "내 이벤트 (주최 중인 이벤트)"
- 섹션 2: "참가 이벤트"
- "새 이벤트 만들기" 버튼 → `/protected/events/new`

**플레이스홀더:**
- 각 섹션에 이벤트 카드 플레이스홀더

**코드 구조 예시:**
```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">대시보드</h1>
        <a href="/protected/events/new">새 이벤트 만들기</a>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">내 이벤트</h2>
        <p className="text-muted-foreground">
          (주최 중인 이벤트 카드 플레이스홀더)
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">참가 이벤트</h2>
        <p className="text-muted-foreground">
          (참가 중인 이벤트 카드 플레이스홀더)
        </p>
      </section>
    </div>
  )
}
```

### 5. 이벤트 생성 (`app/protected/events/new/page.tsx`)

**목적:** 새로운 이벤트 생성 폼

**접근 권한:** 인증 필요

**구성 요소:**
- 제목: "새 이벤트 만들기"
- 안내 텍스트: "(Phase 2에서 폼 구현 예정)"
- "돌아가기" 링크 → `/protected/dashboard`

**데이터:**
- Phase 2에서 Server Actions 연동 예정

**코드 구조 예시:**
```typescript
export default function CreateEventPage() {
  return (
    <div className="space-y-4">
      <a href="/protected/dashboard" className="text-sm text-blue-500">
        ← 돌아가기
      </a>
      <h1 className="text-3xl font-bold">새 이벤트 만들기</h1>
      <p className="text-muted-foreground">
        (Phase 2에서 폼 구현 예정)
      </p>
    </div>
  )
}
```

### 6. 이벤트 수정 (`app/protected/events/[id]/edit/page.tsx`)

**목적:** 기존 이벤트 정보 수정

**접근 권한:** 인증 필요

**구성 요소:**
- 제목: "이벤트 수정"
- 파라미터 표시: "ID: {id}"
- "돌아가기" 링크 → `/protected/dashboard`

**파라미터:**
- `id: string` — 이벤트 ID

**데이터:**
- Phase 2에서 Supabase 연동 예정

**코드 구조 예시:**
```typescript
export default function EditEventPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-4">
      <a href="/protected/dashboard" className="text-sm text-blue-500">
        ← 돌아가기
      </a>
      <h1 className="text-3xl font-bold">이벤트 수정</h1>
      <p className="text-muted-foreground">ID: {params.id}</p>
      <p className="text-muted-foreground">
        (Phase 2에서 폼 구현 예정)
      </p>
    </div>
  )
}
```

### 7. 이벤트 관리 (`app/protected/events/[id]/manage/page.tsx`)

**목적:** 이벤트 참가자 관리 및 공지사항

**접근 권한:** 인증 필요, 이벤트 주최자만

**구성 요소:**
- 제목: "이벤트 관리"
- 파라미터 표시: "ID: {id}"
- 섹션 1: "참가자 관리"
  - Confirmed 참가자 리스트
  - Waitlist 참가자 리스트
  - 참가자 수 표시
- 섹션 2: "공지사항"
  - 공지사항 작성 버튼
  - 공지사항 목록
- "돌아가기" 링크 → `/protected/dashboard`

**파라미터:**
- `id: string` — 이벤트 ID

**데이터:**
- Phase 2에서 Supabase 연동 예정

**코드 구조 예시:**
```typescript
export default function ManageEventPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-4">
      <a href="/protected/dashboard" className="text-sm text-blue-500">
        ← 돌아가기
      </a>
      <h1 className="text-3xl font-bold">이벤트 관리</h1>
      <p className="text-muted-foreground">ID: {params.id}</p>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">참가자 관리</h2>
        <p className="text-muted-foreground">
          (참가자 목록 플레이스홀더)
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">공지사항</h2>
        <p className="text-muted-foreground">
          (공지사항 플레이스홀더)
        </p>
      </section>
    </div>
  )
}
```

## 주의 사항

- **Phase 1 범위:** UI 골격 및 라우트 구조만 구현, 데이터 연동 없음
- **Phase 2:** 각 페이지에 폼, 데이터 로딩, Supabase 연동 추가
- **페이지 구조:** 모든 페이지가 AppHeader/AppFooter를 통해 일관된 네비게이션 제공
- **파라미터 처리:** `[id]` 동적 세그먼트는 자동 추출되어 props로 전달
