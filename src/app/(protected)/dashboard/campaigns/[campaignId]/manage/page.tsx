"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCampaignDetailQuery } from "@/features/campaigns/hooks/useCampaignDetailQuery";
import { useCloseCampaign } from "@/features/campaigns/hooks/useCloseCampaign";
import { useSelectInfluencers } from "@/features/campaigns/hooks/useSelectInfluencers";
import { useResolvedParams } from "@/hooks/useResolvedParams";

type PageProps = { params: Promise<{ campaignId: string }> };

export default function ManageCampaignPage({ params }: PageProps) {
  const { campaignId } = useResolvedParams(params);
  const router = useRouter();
  const { data, isLoading } = useCampaignDetailQuery(campaignId);
  const closeMutation = useCloseCampaign();
  const selectMutation = useSelectInfluencers(campaignId);
  const [selected, setSelected] = useState<string[]>([]);
  const [waitlist, setWaitlist] = useState<string[]>([]);

  const applicants = useMemo(() => [], []); // 실제 지원자 리스트 연동은 추후 확장(별도 API)

  const handleClose = useCallback(async () => {
    await closeMutation.mutateAsync(campaignId);
    router.refresh();
  }, [campaignId, closeMutation, router]);

  const handleSelect = useCallback(async () => {
    await selectMutation.mutateAsync({ selectedApplicationIds: selected, waitlistApplicationIds: waitlist });
    router.refresh();
  }, [selectMutation, selected, waitlist, router]);

  if (isLoading || !data) return <p className="px-6 py-8 text-sm text-slate-500">불러오는 중...</p>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">선정 관리</h1>
        <button onClick={handleClose} className="rounded-md border px-4 py-2">모집 종료</button>
      </header>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">지원자 리스트</h2>
        <p className="text-sm text-slate-500">지원자 목록 API는 추후 연동됩니다.</p>
        <div className="flex gap-3">
          <button onClick={handleSelect} className="rounded-md bg-slate-900 px-4 py-2 text-white">선정/대기자 적용</button>
        </div>
      </section>
    </main>
  );
}

