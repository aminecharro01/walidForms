import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "الاسم الكامل مطلوب"),
    email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صالح"),
    password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
