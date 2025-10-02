"use client";

import { CampaignDetailView } from "@/features/campaigns/components/campaign-detail-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const placeholder = (campaignId: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(`${campaignId}-cta`)}/1200/600`;

type CampaignDetailPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { campaignId } = useResolvedParams(params);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16 text-slate-100">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">캠페인 상세보기</h1>
        <p className="text-sm text-slate-400">
          캠페인을 확인한 후 로그인하여 지원을 완료할 수 있습니다.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <CampaignDetailView campaignId={campaignId} />
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:grid-cols-[1.6fr,1fr]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">지원 준비 완료</h2>
          <p className="text-sm text-slate-300">
            이 캠페인이 마음에 드셨다면, 로그인 후 지원서를 제출하세요.
            선택된 인플루언서에게는 미션 가이드와 일정이 전달됩니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 px-6 text-base font-medium">
              <Link href={`/campaigns/${campaignId}/apply`}>로그인하고 지원하기</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-slate-700 px-6 text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              <Link href="/campaigns">다른 캠페인 탐색</Link>
            </Button>
          </div>
        </div>
        <figure className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 sm:block">
          <div
            className="h-full min-h-[220px] bg-cover bg-center"
            style={{ backgroundImage: `url(${placeholder(campaignId)})` }}
          />
        </figure>
      </section>
    </main>
  );
}
