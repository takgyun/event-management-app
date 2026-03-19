---
name: Phase 3 DB 스키마 및 마이그레이션 현황
description: 이벤트 관리 앱 Supabase DB 구조, 적용된 마이그레이션, 해결된 보안/성능 이슈 현황
type: project
---

Phase 3 DB 개발이 완료되었습니다 (2026-03-20).

**Why:** 이벤트 관리 앱의 핵심 비즈니스 로직(이벤트 CRUD, 참가 신청/취소, 공지사항)을 위한 DB 인프라 구축

**How to apply:** 다음 작업에서 이 프로젝트의 DB 구조를 참조할 때 이 파일을 활용

## 적용된 마이그레이션 (총 4개)

| 버전 | 이름 | 내용 |
|---|---|---|
| 20260317064509 | create_profiles_table | profiles 테이블 |
| 20260319040440 | create_event_tables | events, event_participants, event_notices 테이블 + RLS |
| 20260319040545 | create_participant_functions | apply_to_event, cancel_participation RPC 함수 |
| 20260319041927 | enable_rls_policies | RLS 정책 재정의 |
| (004) | fix_rls_performance_and_function_search_path | RLS 성능 최적화 + 함수 search_path 보안 수정 |

## 핵심 아키텍처

- **참가 신청/취소**: `apply_to_event`, `cancel_participation` PostgreSQL 함수(SECURITY DEFINER) 사용
  - SELECT FOR UPDATE로 Race Condition 방지
  - 대기자 자동 승격 로직 포함
- **RLS 패턴**: `(select auth.uid())` 형태로 서브쿼리 사용 (행별 재평가 방지)
- **함수 보안**: `SET search_path = ''` 필수 (search_path mutable 취약점 방지)

## 로컬 파일 위치

- `supabase/migrations/001~004_*.sql` - 마이그레이션 SQL 파일
- `lib/supabase/types.ts` - DB 타입 정의 (Database 인터페이스)
- `lib/utils/db-mapper.ts` - DB Row → 도메인 타입 변환
- `lib/actions/event.ts`, `participant.ts`, `notice.ts` - Server Actions
- `lib/actions/_helpers.ts` - requireAuth, requireEventHost 헬퍼

## 남은 수동 작업

- Supabase 대시보드 > Auth > Security: "Leaked Password Protection" 활성화
