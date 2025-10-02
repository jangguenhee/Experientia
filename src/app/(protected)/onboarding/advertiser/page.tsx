"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AdvertiserOnboardingInputSchema,
  useAdvertiserStatusQuery,
  useCreateAdvertiser,
  type AdvertiserOnboardingInput,
} from "@/features/advertisers/hooks/useAdvertiserOnboarding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const FormSchema = AdvertiserOnboardingInputSchema;

type FormValues = AdvertiserOnboardingInput;

type PageProps = {
  params: Promise<Record<string, never>>;
};

export default function AdvertiserOnboardingPage({ params }: PageProps) {
  void useResolvedParams(params);

  const router = useRouter();
  const { data, isLoading } = useAdvertiserStatusQuery();
  const { mutateAsync, isPending } = useCreateAdvertiser();
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  React.useEffect(() => {
    if (!isLoading && data?.role === "ADVERTISER" && data?.advertiserCompleted) {
      router.replace("/dashboard/campaigns/new");
    }
  }, [data, isLoading, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values);
    router.replace("/dashboard/campaigns/new");
  });

  if (isLoading) return null;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input placeholder="이름" {...form.register("name")} />
        <Input placeholder="생년월일 YYYY-MM-DD" {...form.register("dob")} />
        <Input placeholder="연락처" {...form.register("phone")} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input placeholder="브랜드명" {...form.register("companyName")} />
        <Input placeholder="사업자 등록번호" {...form.register("businessNumber")} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input placeholder="대표자명" {...form.register("representative")} />
        <Input placeholder="매장 연락처" {...form.register("storePhone")} />
      </div>

      <Input placeholder="주소" {...form.register("address")} />

      <Button type="submit" disabled={isPending} className="w-full">
        정보 제출하고 캠페인 생성으로 이동
      </Button>
    </form>
  );
}
