"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const SignupFormSchema = z
  .object({
    email: z.string().email({ message: "유효한 이메일을 입력하세요." }),
    password: z.string().min(6, { message: "비밀번호는 6자 이상이어야 합니다." }),
    confirmPassword: z.string().min(6),
    agree: z
      .boolean({ required_error: "약관 동의 여부를 선택하세요." })
      .refine((value) => value, {
        message: "약관에 동의해야 가입이 가능합니다.",
      }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof SignupFormSchema>;

const TermsDialog = () => (
  <Dialog.Root>
    <Dialog.Trigger asChild>
      <button
        type="button"
        className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-300"
      >
        약관 및 개인정보 처리방침
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl outline-none">
        <Dialog.Title className="text-lg font-semibold text-slate-100">
          이용약관 & 개인정보 처리방침
        </Dialog.Title>
        <Dialog.Description className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            회원가입 시 입력한 개인정보는 서비스 운영과 마케팅 목적에 한해 사용되며,
            법령에서 정한 기간 동안 안전하게 보관됩니다.
          </p>
          <p>
            이용자는 언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있으며,
            요청 시 지체 없이 처리됩니다.
          </p>
          <p>
            세부 내용은 privacy@supernext.io 로 문의해 주세요.
          </p>
        </Dialog.Description>
        <div className="flex justify-end">
          <Dialog.Close asChild>
            <Button variant="secondary" className="h-9 px-4 text-sm">
              닫기
            </Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void useResolvedParams(params);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, refresh } = useCurrentUser();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agree: false,
    },
    mode: "onChange",
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/onboarding";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  const isSubmitDisabled = useMemo(
    () => isSubmitting || !form.formState.isValid,
    [form.formState.isValid, isSubmitting],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    const supabase = getSupabaseBrowserClient();

    try {
      const result = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        toast({
          title: "회원가입에 실패했습니다.",
          description: result.error.message ?? "잠시 후 다시 시도해 주세요.",
        });
        return;
      }

      await refresh();
      setPendingEmail(values.email);

      if (result.data.session) {
        toast({ title: "회원가입 완료", description: "온보딩을 계속 진행하세요." });
        const redirectedFrom = searchParams.get("redirectedFrom") ?? "/onboarding";
        router.replace(redirectedFrom);
        return;
      }

      toast({
        title: "확인 이메일 발송",
        description: "받은 편지함에서 인증을 완료해 주세요.",
      });
      router.prefetch("/auth/login");
      form.reset({ email: "", password: "", confirmPassword: "", agree: false });
    } catch (error) {
      toast({
        title: "알 수 없는 오류",
        description: error instanceof Error ? error.message : "다시 시도해 주세요.",
      });
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100">
      <div className="absolute inset-0 -z-10 opacity-25" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />
      </div>

      <Card className="w-full max-w-2xl border-slate-800 bg-slate-950/80 backdrop-blur">
        <CardHeader className="space-y-4">
          <Badge variant="outline" className="w-fit border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
            신규 회원 등록
          </Badge>
          <CardTitle className="text-2xl font-semibold">SuperNext에 합류하기</CardTitle>
          <CardDescription>
            가입 후 안내에 따라 역할을 선택하고 온보딩을 완료하면 캠페인을 탐색하거나 등록할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-slate-400" /> 이메일
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        placeholder="influencer@supernext.io"
                        className="bg-slate-900/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <LockKeyhole className="h-4 w-4 text-slate-400" /> 비밀번호
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="영문, 숫자 조합"
                          className="bg-slate-900/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-slate-400" /> 비밀번호 확인
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="다시 입력"
                          className="bg-slate-900/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="agree"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-3">
                    <FormControl>
                      <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-3">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-slate-600 data-[state=checked]:border-cyan-400 data-[state=checked]:bg-cyan-500/80"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">
                            약관 및 개인정보 수집에 동의합니다.
                          </span>
                          <TermsDialog />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      동의 후 회원가입 버튼을 눌러 주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full text-base font-medium"
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> 가입 처리 중...
                  </span>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3 text-sm text-slate-400">
          {pendingEmail ? (
            <p className="text-center text-xs text-cyan-200">
              {pendingEmail} 로 인증 메일을 발송했습니다. 메일함을 확인해 주세요.
            </p>
          ) : null}
          <p>
            이미 계정이 있으신가요?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-slate-200 underline underline-offset-4"
            >
              로그인하기
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
