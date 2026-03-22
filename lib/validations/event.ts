import { z } from 'zod';

// 이벤트 생성 폼 스키마
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, '이벤트 제목은 필수입니다.')
    .min(3, '이벤트 제목은 3글자 이상이어야 합니다.')
    .max(100, '이벤트 제목은 100글자 이하여야 합니다.'),

  description: z.string().max(500, '설명은 500글자 이하여야 합니다.').optional().default(''),

  eventDate: z
    .string()
    .datetime('유효한 날짜와 시간을 입력해주세요.')
    .refine((date) => new Date(date) > new Date(), '이벤트 날짜는 현재 시간 이후여야 합니다.'),

  location: z
    .string()
    .min(1, '장소는 필수입니다.')
    .min(3, '장소는 3글자 이상이어야 합니다.')
    .max(100, '장소는 100글자 이하여야 합니다.'),

  maxCapacity: z
    .number()
    .int('정원은 정수여야 합니다.')
    .min(1, '정원은 1명 이상이어야 합니다.')
    .max(1000, '정원은 1000명 이하여야 합니다.'),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

// 이벤트 수정 폼 스키마 (모든 필드 optional)
export const updateEventSchema = z.object({
  title: z
    .string()
    .min(3, '이벤트 제목은 3글자 이상이어야 합니다.')
    .max(100, '이벤트 제목은 100글자 이하여야 합니다.')
    .optional(),

  description: z.string().max(500, '설명은 500글자 이하여야 합니다.').optional(),

  location: z
    .string()
    .min(3, '장소는 3글자 이상이어야 합니다.')
    .max(100, '장소는 100글자 이하여야 합니다.')
    .optional(),
});

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>;
