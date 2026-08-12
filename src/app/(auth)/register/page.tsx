"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth-schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName } },
    });

    if (error) {
      setServerError(
        error.message.includes("already registered")
          ? "هذا البريد الإلكتروني مسجل مسبقاً"
          : "حدث خطأ أثناء إنشاء الحساب، الرجاء المحاولة مرة أخرى"
      );
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-cairo)] text-lg font-bold text-slate-900">
            تحقق من بريدك الإلكتروني
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            أرسلنا رابط تأكيد إلى بريدك الإلكتروني. الرجاء تأكيد حسابك لتتمكن من تسجيل الدخول.
          </p>
          <Link href="/login" className="mt-6">
            <Button variant="outline">العودة إلى تسجيل الدخول</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h1 className="font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
          إنشاء حساب جديد
        </h1>
        <p className="mt-1 text-sm text-slate-500">ابدأ بإنشاء نماذجك الأولى في دقائق</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <div>
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="fullName" placeholder="محمد أحمد" className="pr-10" {...register("fullName")} />
            </div>
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                className="pr-10"
                {...register("email")}
              />
            </div>
            <FieldError>{errors.email?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pr-10"
                {...register("password")}
              />
            </div>
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pr-10"
                {...register("confirmPassword")}
              />
            </div>
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            إنشاء الحساب
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
