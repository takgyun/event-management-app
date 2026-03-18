# Phase 1: 애플리케이션 골격 구축

## 목표

스타터킷 전용 요소를 제거하고, 이벤트 관리 앱의 실제 골격(라우트, 레이아웃, 타입)을 구축합니다.

## ROADMAP.md 항목

- [x] P1-1.1 개발 환경 구성 (이미 완료: Next.js 15, TypeScript, Tailwind CSS)
- [ ] P1-1.2 라우트 구조 및 레이아웃 골격 생성
- [ ] P1-1.3 TypeScript 인터페이스 및 타입 정의
- [ ] P1-1.4 데이터 모델 설계 (ERD 문서)

## 전체 파일 목록

### 신규 생성

**타입 및 컴포넌트:**
- `lib/types/index.ts` - 도메인 타입 정의 (Event, User, Participant, Notice 등)
- `components/layout/app-header.tsx` - 앱 헤더 (로고, 네비게이션, 인증 버튼)
- `components/layout/app-footer.tsx` - 앱 푸터

**라우트 구조:**
- `app/(public)/layout.tsx` - 공개 라우트 그룹 레이아웃
- `app/(public)/page.tsx` - 홈 페이지 (앱 콘텐츠로 교체)
- `app/(public)/events/page.tsx` - 공개 이벤트 목록
- `app/(public)/events/[id]/page.tsx` - 이벤트 상세 (공개)
- `app/protected/dashboard/page.tsx` - 대시보드
- `app/protected/events/new/page.tsx` - 이벤트 생성
- `app/protected/events/[id]/edit/page.tsx` - 이벤트 수정
- `app/protected/events/[id]/manage/page.tsx` - 이벤트 관리

**문서:**
- `docs/ERD.md` - 데이터 모델 설계 (테이블 스키마, 관계, RLS 설계)

### 수정

- `app/layout.tsx` - metadata 업데이트, `lang="ko"` 설정
- `app/page.tsx` → 삭제 후 `app/(public)/page.tsx`로 이동 및 내용 교체
- `app/protected/layout.tsx` - AppHeader/AppFooter 컴포넌트로 교체, 스타터킷 요소 제거

## 완료 체크리스트

- [ ] `tasks/` 폴더 문서 5개 작성 완료
  - [ ] phase1-overview.md
  - [ ] phase1-1-setup.md
  - [ ] phase1-2-layout.md
  - [ ] phase1-3-pages.md
  - [ ] phase1-4-erd.md
- [ ] `lib/types/index.ts` 생성 완료
- [ ] `components/layout/app-header.tsx` 생성 완료
- [ ] `components/layout/app-footer.tsx` 생성 완료
- [ ] `app/(public)/layout.tsx` 생성 완료
- [ ] `app/(public)/page.tsx` 생성 및 홈 콘텐츠로 교체 완료
- [ ] `app/protected/layout.tsx` 업데이트 완료
- [ ] 공개 페이지 생성: events, events/[id]
- [ ] 보호 페이지 생성: dashboard, new, edit, manage
- [ ] `app/layout.tsx` 메타데이터 업데이트 완료
- [ ] `docs/ERD.md` 생성 완료
- [ ] `npm run dev` 로컬 검증 완료
- [ ] `npm run lint` 통과
- [ ] `npm run build` 성공

## 진행 상황

**상태:** 계획 단계 → 문서 작성 중...
**다음 단계:** 사용자 검토 → 코드 구현
