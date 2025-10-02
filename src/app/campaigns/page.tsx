"use client";

import Link from "next/link";
import { CampaignDiscoveryView } from "@/features/campaigns/components/campaign-discovery-view";
import { Button } from "@/components/ui/button";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const heroBackground = "https://picsum.photos/seed/campaign-hero/1600/900";

type CampaignsPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CampaignsPage({ params }: CampaignsPageProps) {
  void useResolvedParams(params);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24 text-slate-100">
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-20 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            오픈된 캠페인 한눈에
          </span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            인플루언서와 브랜드가 만나는<br />
            가장 빠른 매칭 허브
          </h1>
          <p className="max-w-xl text-base text-slate-300">
            지역·카테고리별로 맞춤 캠페인을 탐색하고, 인기순 정렬로 트렌드를 확인하세요.
            로그인하지 않아도 어떤 기회가 있는지 미리 살펴볼 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 px-6 text-base font-medium">
              <Link href="/auth/signup">무료로 시작하기</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-slate-700 px-6 text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              <Link href="#campaign-list">캠페인 둘러보기</Link>
            </Button>
          </div>
        </div>
        <figure className="relative hidden flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl lg:block">
          <div
            className="h-full min-h-[320px] rounded-2xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBackground})` }}
          />
          <figcaption className="mt-4 text-sm text-slate-400">
            실시간으로 업데이트되는 인기 캠페인을 확인하고 바로 지원하세요.
          </figcaption>
        </figure>
      </section>

      <section id="campaign-list" className="mx-auto w-full max-w-6xl space-y-8 px-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-slate-100">모집 중인 캠페인</h2>
          <p className="text-sm text-slate-400">
            필터와 정렬을 활용해 내 채널과 가장 어울리는 프로모션을 찾아보세요.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
          <CampaignDiscoveryView />
        </div>
      </section>
    </main>
  );
}
