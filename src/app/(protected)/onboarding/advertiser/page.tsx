"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, User, Phone, MapPin } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useResolvedParams } from "@/hooks/useResolvedParams";
import {
  AdvertiserOnboardingInputSchema,
  type AdvertiserOnboardingInput,
  useAdvertiserStatusQuery,
  useCreateAdvertiser,
} from "@/features/advertisers/hooks/useAdvertiserOnboarding";

const FormSchema = AdvertiserOnboardingInputSchema;

type FormValues = AdvertiserOnboardingInput;

type PageProps = {
  params: Promise<Record<string, never>>;
};

export default function AdvertiserOnboardingPage({ params }: PageProps) {
  void useResolvedParams(params);

  const router = useRouter();
  const { data: status, isLoading: statusLoading } = useAdvertiserStatusQuery();
  const createAdvertiser = useCreateAdvertiser();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      dob: "",
      phone: "",
      companyName: "",
      businessNumber: "",
      representative: "",
      storePhone: "",
      address: "",
    },
    mode: "onChange",
  });

  const isSubmitting = useMemo(
    () => createAdvertiser.isPending || form.formState.isSubmitting,
    [createAdvertiser.isPending, form.formState.isSubmitting],
  );

  useEffect(() => {
    if (statusLoading || !status) {
      return;
    }

    if (status.role === "INFLUENCER") {
      router.replace("/onboarding/influencer");
      return;
    }

    if (status.role === "ADVERTISER" && status.advertiserCompleted) {
      router.replace("/dashboard/campaigns/new");
    }
  }, [router, status, statusLoading]);

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      try {
        await createAdvertiser.mutateAsync(values);
        toast({
          title: "광고주 온보딩 완료",
          description: "이제 캠페인을 등록할 수 있어요.",
        });
        router.replace("/dashboard/campaigns/new");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (message.includes("이미 존재")) {
          router.replace("/dashboard/campaigns/new");
          return;
        }

        toast({
          title: "광고주 정보 저장 실패",
          description: message || "다시 시도해 주세요.",
        });
      }
    },
    [createAdvertiser, router],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-16 text-slate-100">
      <header className="space-y-3">
        <Badge variant="outline" className="w-fit border-slate-700 bg-slate-900/60 text-slate-300">
          Onboarding Step 2 · 광고주
        </Badge>
        <h1 className="text-3xl font-semibold">브랜드 정보를 입력해 주세요</h1>
        <p className="text-sm text-slate-400">
          기본 프로필과 브랜드 정보를 작성하면 SuperNext 대시보드에서 캠페인을 생성할 수 있습니다.
        </p>
      </header>

      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-100">
            <Building2 className="h-5 w-5 text-emerald-300" /> 광고주 온보딩 폼
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            입력한 정보는 캠페인 노출 및 지원자 커뮤니케이션에 활용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <section className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-sm font-medium">
                        <User className="h-4 w-4 text-slate-400" /> 이름
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="홍길동" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-sm font-medium">
                        생년월일
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="1992-05-16"
                          className="bg-slate-900/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-sm font-medium">
                        <Phone className="h-4 w-4 text-slate-400" /> 연락처
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="010-0000-0000" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">브랜드명</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="슈퍼넥스트 카페" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">사업자 등록번호</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000-00-00000" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">대표자명</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="대표자명" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">매장 연락처</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="02-000-0000" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-slate-400" /> 주소
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="서울특별시 강남구 테헤란로" className="bg-slate-900/60" />
                    </FormControl>
                    <FormDescription>
                      실제 매장 주소 또는 브랜드 운영 주소를 입력해 주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={statusLoading || isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> 저장 중...
                  </span>
                ) : (
                  "정보 제출하고 대시보드로 이동"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
