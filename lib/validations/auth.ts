import { z } from 'zod';

// 로그인 스키마
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),

  password: z
    .string()
    .min(1, '비밀번호는 필수입니다.')
    .min(8, '비밀번호는 8글자 이상이어야 합니다.')
    .max(100, '비밀번호는 100글자 이하여야 합니다.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// 회원가입 스키마
export const signUpSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1, '비밀번호 확인은 필수입니다.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
