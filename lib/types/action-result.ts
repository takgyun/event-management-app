/**
 * Server Action 통일된 반환 타입
 *
 * 모든 Server Action은 이 타입을 사용하여 일관된 응답 구조를 보장합니다.
 *
 * @template T - 성공 시 반환할 데이터 타입 (기본값: void)
 *
 * @example
 * // void 반환 (단순 작업)
 * export async function deleteEvent(id: string): Promise<ActionResult> { ... }
 *
 * @example
 * // 데이터 반환
 * export async function createEvent(input: CreateEventInput): Promise<ActionResult<Event>> { ... }
 *
 * @example
 * // 클라이언트에서 사용
 * const result = await createEvent(input);
 * if (result.success) {
 *   console.log(result.data); // 타입: T
 * } else {
 *   console.error(result.error); // 타입: string
 *   console.error(result.fieldErrors); // 타입: Record<string, string[]> | undefined
 * }
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
