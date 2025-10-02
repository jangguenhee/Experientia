"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmitReview } from "@/features/submissions/hooks/useSubmitReview";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const FormSchema = z.object({ reviewUrl: z.string().url() });
type FormValues = z.infer<typeof FormSchema>;

type PageProps = { params: Promise<{ applicationId: string }> };

export default function SubmitReviewPage({ params }: PageProps) {
  const { applicationId } = useResolvedParams(params);
  const router = useRouter();
  const { mutateAsync, isPending } = useSubmitReview();
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = useCallback(async (values: FormValues) => {
    await mutateAsync({ applicationId, reviewUrl: values.reviewUrl });
    router.replace(`/applications/${applicationId}`);
  }, [mutateAsync, applicationId, router]);

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">리뷰 제출</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">리뷰 URL</label>
          <input placeholder="https://" className="w-full rounded-md border px-3 py-2" {...form.register("reviewUrl")} />
        </div>
        <button disabled={isPending} className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50">제출</button>
      </form>
    </main>
  );
}

