"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateApplication } from "@/features/applications/hooks/useCreateApplication";
import { useResolvedParams } from "@/hooks/useResolvedParams";
import { useRequireRole } from "@/features/auth/hooks/useRequireRole";
import { toast } from "@/hooks/use-toast";

const FormSchema = z.object({
  note: z.string().max(500).optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type FormValues = z.infer<typeof FormSchema>;

type PageProps = { params: Promise<{ campaignId: string }> };

export default function ApplyPage({ params }: PageProps) {
  const { campaignId } = useResolvedParams(params);
  const router = useRouter();
  const { canProceed, isChecking } = useRequireRole("INFLUENCER");
  const { mutateAsync, isPending } = useCreateApplication();
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      await mutateAsync({ campaignId, ...values });
      router.replace("/applications");
    } catch (error) {
      const message = error instanceof Error ? error.message : "지원에 실패했습니다.";
      toast({ title: "지원 실패", description: message });
    }
  }, [campaignId, mutateAsync, router]);

  if (isChecking || !canProceed) {
    return null;
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">체험단 지원</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">각오 한마디</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={4} {...form.register("note")} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">방문 예정일</label>
          <input placeholder="YYYY-MM-DD" className="w-full rounded-md border px-3 py-2" {...form.register("visitDate")} />
        </div>
        <button disabled={isPending} className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50">지원하기</button>
      </form>
    </main>
  );
}
