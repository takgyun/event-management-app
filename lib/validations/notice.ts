import { z } from 'zod';

// 공지사항 생성 스키마
export const createNoticeSchema = z.object({
  content: z
    .string()
    .min(1, '공지사항 내용은 필수입니다.')
    .max(1000, '공지사항은 1000글자 이하여야 합니다.'),
});

export type CreateNoticeFormValues = z.infer<typeof createNoticeSchema>;
