# Phase 2: UI/UX 완성 - 전체 개요

## Phase 2 목표

Next.js 15 + Supabase 기반 이벤트 관리 애플리케이션의 UI/UX 완성.
더미 데이터를 활용하여 모든 인터랙션을 구현하고, 반응형 디자인 및 접근성을 보장합니다.

---

## Phase 1 완성 항목 (재구현 불필요)

✅ **컴포넌트**
- `components/events/event-card.tsx` - 3가지 variant (list/host/participant)
- `components/events/event-status-badge.tsx`, `participant-status-badge.tsx`
- `components/ui/empty-state.tsx`

✅ **레이아웃**
- `components/layout/app-header.tsx`, `app-footer.tsx`

✅ **데이터**
- `lib/data/mock-data.ts` - 더미 데이터 + 유틸 함수

✅ **페이지**
- `app/(public)/events/page.tsx` - 목록 + 탭 필터
- `app/(public)/events/[id]/page.tsx` - 기본 정보 표시
- `app/protected/dashboard/page.tsx` - 주최/참가 이벤트 목록

✅ **인증**
- `app/auth/` - Supabase Auth 실제 구현

---

## Phase 2 구현 항목

### P2-4: 이벤트 상세 인터랙션 ([phase2-4-event-detail.md](./phase2-4-event-detail.md))
- 참가신청/취소 버튼 (상태 관리)
- 초대 링크 복사 버튼 (클립보드 API)
- 미로그인 시 로그인 모달

### P2-5: 이벤트 생성/수정 폼 ([phase2-5-event-form.md](./phase2-5-event-form.md))
- React Hook Form + Zod 유효성 검사
- 생성 및 수정 페이지
- 폼 필드: 제목, 설명, 일시, 장소, 최대 참가자 수

### P2-7: 이벤트 관리 페이지 ([phase2-7-event-manage.md](./phase2-7-event-manage.md))
- 참가자 명단 (확정/대기 탭)
- 참가자 승인 기능
- 공지사항 작성 및 표시

### P2-8: 반응형 디자인 + 접근성 ([phase2-8-responsive.md](./phase2-8-responsive.md))
- 모바일 햄버거 메뉴
- 320px~1440px 반응형 레이아웃
- ARIA 라벨 및 포커스 관리

---

## 신규 생성 파일 (8개)

| 파일명 | 용도 |
|--------|------|
| `components/events/participation-button.tsx` | 참가신청/취소 상태 관리 |
| `components/events/invite-link-button.tsx` | 초대 링크 복사 |
| `components/events/login-required-dialog.tsx` | 미로그인 모달 |
| `components/events/event-form.tsx` | 생성/수정 폼 (React Hook Form + Zod) |
| `components/events/edit-event-form-client.tsx` | 수정 페이지 클라이언트 래퍼 |
| `components/events/participant-list.tsx` | 참가자 명단 (탭 UI) |
| `components/events/notice-form.tsx` | 공지사항 작성 |
| `components/events/manage-status-buttons.tsx` | 이벤트 완료/취소 버튼 |

---

## 수정 파일 (6개)

| 파일명 | 변경 사항 |
|--------|----------|
| `app/(public)/events/[id]/page.tsx` | 인터랙션 버튼 통합 |
| `app/protected/events/new/page.tsx` | EventForm 생성 모드 |
| `app/protected/events/[id]/edit/page.tsx` | EventForm 수정 모드 |
| `app/protected/events/[id]/manage/page.tsx` | 관리 페이지 구현 |
| `components/events/event-card.tsx` | 관리 버튼 링크 수정 |
| `components/layout/app-header.tsx` | 모바일 햄버거 메뉴 추가 |

---

## 더미 데이터 전략

### 로그인한 사용자 시뮬레이션
```typescript
// Mock 현재 사용자 (lib/data/mock-data.ts에서 정의)
export const MOCK_CURRENT_USER_ID = 'user-002';  // 참가자 역할
export const MOCK_HOST_USER_ID = 'user-001';      // 주최자 역할
```

### 사용 사례
- **이벤트 상세 페이지**: 현재 사용자가 주최자/참가자/미참가자 분기
- **대시보드**: MOCK_CURRENT_USER_ID로 필터링된 이벤트 표시
- **관리 페이지**: MOCK_HOST_USER_ID로 필터링된 이벤트만 접근 가능

### 로컬 상태 관리
모든 인터랙션은 더미 로직으로 구현 (실제 DB 저장 X):
- 참가신청: `useState` + 500ms setTimeout
- 공지사항 추가: `useState`로 메모리에 저장
- 폼 제출: 1초 딜레이 후 toast + 페이지 이동

---

## 구현 순서

1. **P2-5 (이벤트 폼)** - 가장 복잡하므로 먼저 구현
2. **P2-4 (상세 인터랙션)** - 폼 없이 간단한 버튼 로직
3. **P2-7 (관리 페이지)** - 참가자 명단, 공지사항
4. **P2-8 (반응형/접근성)** - 모든 컴포넌트 완성 후 최종 다듬기

---

## 완료 체크리스트

- [ ] P2-4: 이벤트 상세 인터랙션 (3개 컴포넌트 + 1개 페이지 수정)
- [ ] P2-5: 이벤트 폼 (2개 컴포넌트 + 2개 페이지 수정)
- [ ] P2-7: 이벤트 관리 (3개 컴포넌트 + 1개 페이지 구현)
- [ ] P2-8: 반응형/접근성 (1개 헤더 수정 + 전체 감사)
- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] 모바일(320px) ~ 데스크톱(1440px) 레이아웃 확인
- [ ] 다크 모드 스타일 확인

---

## 기술 주의사항

### Next.js 15 변경사항
```typescript
// 파라미터는 Promise로 감싸짐
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### 날짜 처리
```typescript
// HTML input: date/time 분리
<input type="date" {...field} />
<input type="time" {...field} />

// 폼 제출 시: ISO 8601로 합산
const eventDate = new Date(`${date}T${time}`).toISOString();
```

### 더미 로직 패턴
```typescript
const handleAction = async () => {
  setLoading(true);
  try {
    // 500~1000ms 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));
    // 로컬 상태 업데이트
    setState(newValue);
    // 토스트 피드백
    toast.success('작업 완료');
  } finally {
    setLoading(false);
  }
};
```

### 클라이언트/서버 분리
```typescript
// 서버 컴포넌트: 데이터 조회
export default async function Page() {
  const data = await getEventData();
  return <ClientComponent data={data} />;
}

// 클라이언트 컴포넌트: 상태 관리 + 인터랙션
'use client';
export function ClientComponent({ data }) {
  const [state, setState] = useState(data);
  return <div>{state}</div>;
}
```

---

## 참고: 기존 구현 패턴

- **UI 컴포넌트**: shadcn/ui (new-york)
- **스타일**: Tailwind CSS
- **토스트**: sonner (`app/layout.tsx`에 `<Toaster />` 있음)
- **경로 별칭**: `@/` 사용 권장
- **타입스크립트**: strict mode 활성화
