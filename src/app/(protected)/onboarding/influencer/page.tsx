"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Phone, Globe } from "lucide-react";
import { z } from "zod";
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
import {
  useCreateInfluencer,
  useCreateProfile,
  useOnboardingStatus,
} from "@/features/auth/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const InfluencerOnboardingSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  dob: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, {
    message: "YYYY-MM-DD 형식으로 입력하세요.",
  }),
  phone: z.string().min(8, "연락처를 입력하세요."),
  channelPlatform: z.enum([
    "NAVER_BLOG",
    "INSTAGRAM",
    "YOUTUBE",
    "THREADS",
    "OTHER",
  ]),
  channelName: z.string().min(1, "채널명을 입력하세요."),
  channelUrl: z.string().url({ message: "유효한 URL을 입력하세요." }),
  followers: z.coerce.number({ invalid_type_error: "숫자로 입력하세요." })
    .int({ message: "정수로 입력하세요." })
    .nonnegative({ message: "0 이상 입력하세요." }),
});

type InfluencerOnboardingValues = z.infer<typeof InfluencerOnboardingSchema>;

type PageProps = {
  params: Promise<Record<string, never>>;
};

export default function InfluencerOnboardingPage({ params }: PageProps) {
  void useResolvedParams(params);

  const router = useRouter();
  const { data: status } = useOnboardingStatus();
  const profileMutation = useCreateProfile();
  const influencerMutation = useCreateInfluencer();

  const form = useForm<InfluencerOnboardingValues>({
    resolver: zodResolver(InfluencerOnboardingSchema),
    defaultValues: {
      name: "",
      dob: "",
      phone: "",
      channelPlatform: "INSTAGRAM",
      channelName: "",
      channelUrl: "",
      followers: 0,
    },
    mode: "onChange",
  });

  const isSubmitting = useMemo(
    () =>
      profileMutation.isPending || influencerMutation.isPending ||
      form.formState.isSubmitting,
    [form.formState.isSubmitting, influencerMutation.isPending, profileMutation.isPending],
  );

  useEffect(() => {
    if (!status) return;
    if (status.role && status.role !== "INFLUENCER") {
      toast({
        title: "역할이 이미 설정되었습니다.",
        description: "광고주 온보딩으로 이동합니다.",
      });
      router.replace("/onboarding/advertiser");
    }
  }, [router, status]);

  const handleSubmit = useCallback(
    async (values: InfluencerOnboardingValues) => {
      try {
        await profileMutation.mutateAsync({
          role: "INFLUENCER",
          name: values.name,
          dob: values.dob,
          phone: values.phone,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.includes("이미") && !message.includes("존재")) {
          toast({ title: "프로필 생성 실패", description: message || "다시 시도해 주세요." });
          return;
        }
      }

      try {
        await influencerMutation.mutateAsync({
          channelPlatform: values.channelPlatform,
          channelName: values.channelName,
          channelUrl: values.channelUrl,
          followers: values.followers,
        });
        toast({
          title: "인플루언서 온보딩이 완료되었습니다.",
          description: "좋아하는 캠페인을 둘러보세요!",
        });
        router.replace("/campaigns");
      } catch (error) {
        toast({
          title: "채널 정보 저장 실패",
          description: error instanceof Error ? error.message : "다시 시도해 주세요.",
        });
      }
    },
    [influencerMutation, profileMutation, router],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-16 text-slate-100">
      <header className="space-y-3">
        <Badge variant="outline" className="w-fit border-slate-700 bg-slate-900/60 text-slate-300">
          Onboarding Step 2 · 인플루언서
        </Badge>
        <h1 className="text-3xl font-semibold">채널 정보를 입력해 주세요</h1>
        <p className="text-sm text-slate-400">
          나와 어울리는 캠페인 추천을 위해 기본 프로필과 채널 정보를 입력해주세요.
          정보는 Camapaign 매칭과 선정 프로세스에만 사용됩니다.
        </p>
      </header>

      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-100">
            <Globe className="h-5 w-5 text-indigo-300" /> 인플루언서 온보딩 폼
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            SNS 채널 정보를 입력하면 캠페인 추천 품질이 향상됩니다.
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
                        <Input {...field} placeholder="이름" className="bg-slate-900/60" />
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
                      <FormLabel className="text-sm font-medium">생년월일</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1998-03-20" className="bg-slate-900/60" />
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
                        <Input {...field} placeholder="010-1234-5678" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="channelPlatform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">플랫폼</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-900/60 text-slate-100">
                            <SelectValue placeholder="채널 플랫폼" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 text-slate-100">
                          <SelectItem value="NAVER_BLOG">네이버 블로그</SelectItem>
                          <SelectItem value="INSTAGRAM">인스타그램</SelectItem>
                          <SelectItem value="YOUTUBE">유튜브</SelectItem>
                          <SelectItem value="THREADS">스레드</SelectItem>
                          <SelectItem value="OTHER">기타</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">채널명</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="채널 별명" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channelUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-sm font-medium">채널 URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://instagram.com/yourchannel" className="bg-slate-900/60" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="followers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">팔로워 수</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          step={1}
                          className="bg-slate-900/60"
                        />
                      </FormControl>
                      <FormDescription>숫자만 입력해 주세요.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> 저장 중...
                  </span>
                ) : (
                  "정보 제출하고 캠페인 둘러보기"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
