"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCampaign } from "@/features/campaigns/hooks/useCreateCampaign";
import { CategoryEnum, RegionEnum } from "@/features/campaigns/lib/dto";
import { useRequireRole } from "@/features/auth/hooks/useRequireRole";
import { toast } from "@/hooks/use-toast";

const FormSchema = z.object({
  title: z.string().min(1),
  category: CategoryEnum,
  region: RegionEnum,
  benefitDesc: z.string().min(1),
  storeInfo: z.string().min(1),
  mission: z.string().min(1),
  capacity: z.coerce.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selectionDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

type PageProps = { params: Promise<Record<string, never>> };

export default function NewCampaignPage({ params }: PageProps) {
  void params;
  const router = useRouter();
  const { canProceed, isChecking } = useRequireRole("ADVERTISER");
  const { mutateAsync, isPending } = useCreateCampaign();
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      const created = await mutateAsync(values);
      router.replace(`/dashboard/campaigns/${created.id}/manage`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "캠페인 생성에 실패했습니다.";
      toast({ title: "캠페인 생성 실패", description: message });
    }
  }, [mutateAsync, router]);

  useEffect(() => {
    if (!isChecking && !canProceed) {
      form.reset();
    }
  }, [canProceed, form, isChecking]);

  if (isChecking) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">캠페인 생성</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {(["title","benefitDesc","storeInfo","mission"] as const).map((name) => (
          <div key={name} className="space-y-2">
            <label className="block text-sm font-medium">{name}</label>
            <input className="w-full rounded-md border px-3 py-2" {...form.register(name)} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">카테고리</label>
            <select className="w-full rounded-md border px-3 py-2" {...form.register("category")}>
              {CategoryEnum.options.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">지역</label>
            <select className="w-full rounded-md border px-3 py-2" {...form.register("region")}>
              {RegionEnum.options.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">정원</label>
            <input type="number" className="w-full rounded-md border px-3 py-2" {...form.register("capacity", { valueAsNumber: true })} />
          </div>
          {(["startDate","endDate","selectionDeadline"] as const).map((name) => (
            <div key={name} className="space-y-2">
              <label className="block text-sm font-medium">{name}</label>
              <input placeholder="YYYY-MM-DD" className="w-full rounded-md border px-3 py-2" {...form.register(name)} />
            </div>
          ))}
        </div>
        <button disabled={isPending} className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50">생성</button>
      </form>
    </main>
  );
}
