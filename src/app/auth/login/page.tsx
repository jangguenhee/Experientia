"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const LoginFormSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요." }),
  password: z.string().min(6, { message: "비밀번호는 6자 이상이어야 합니다." }),
});

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
            서비스 이용을 위해 계정 생성 및 로그인 과정에서 수집되는 개인정보는
            본 약관에 따라 안전하게 관리됩니다.
          </p>
          <p>
            수집 항목: 이메일, 성명, 연락처, 채널 URL. 서비스 제공 목적 외에 사용하지 않으며,
            이용자는 언제든지 정보 열람 및 삭제를 요청할 수 있습니다.
          </p>
          <p>
            자세한 내용은 고객센터(privacy@supernext.io)로 문의해주세요.
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

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void useResolvedParams(params);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, refresh } = useCurrentUser();

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: "", password: "" },
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
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          title: "로그인에 실패했습니다.",
          description: error.message ?? "이메일 또는 비밀번호를 다시 확인하세요.",
        });
        return;
      }

      await refresh();
      toast({ title: "로그인 완료", description: "환영합니다!" });

      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/onboarding";
      router.replace(redirectedFrom);
    } catch (error) {
      toast({
        title: "알 수 없는 오류",
        description: error instanceof Error ? error.message : "로그인을 다시 시도해주세요.",
      });
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100">
      <div className="absolute inset-0 -z-10 opacity-20" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.25),_transparent_55%)]" />
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-950/80 backdrop-blur">
        <CardHeader>
          <BadgeHeading />
          <CardTitle className="text-2xl font-semibold">다시 만나서 반가워요!</CardTitle>
          <CardDescription>
            등록된 이메일과 비밀번호로 로그인하면 온보딩을 이어갈 수 있습니다.
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
                        placeholder="you@example.com"
                        className="bg-slate-900/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        autoComplete="current-password"
                        placeholder="******"
                        className="bg-slate-900/60"
                      />
                    </FormControl>
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
                    <Loader2 className="h-4 w-4 animate-spin" /> 로그인 중...
                  </span>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 text-sm text-slate-400">
          <TermsDialog />
          <p className="w-full text-center text-sm text-slate-400">
            계정이 없으신가요?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-slate-200 underline underline-offset-4"
            >
              회원가입 하기
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

const BadgeHeading = () => (
  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-300">
    <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-800/60 px-2 py-0.5">
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
      SuperNext 인증
    </span>
  </div>
);
