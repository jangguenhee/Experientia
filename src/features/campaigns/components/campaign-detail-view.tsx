"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useOnboardingStatusQuery } from "@/features/auth/hooks/useOnboardingGuards";
import { useCampaignDetailQuery } from "../hooks/useCampaignDetailQuery";

export function CampaignDetailView({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();
  const { data: onboardingStatus, isLoading: statusLoading } = useOnboardingStatusQuery({
    enabled: isAuthenticated,
  });
  const { data, isLoading, error } = useCampaignDetailQuery(campaignId);

  const handleApply = useCallback(() => {
    if (!isAuthenticated) {
      router.replace("/onboarding/role");
      return;
    }

    if (!onboardingStatus || !onboardingStatus.hasProfile || onboardingStatus.role === null) {
      router.replace("/onboarding/role");
      return;
    }

    if (onboardingStatus.role !== "INFLUENCER") {
      if (onboardingStatus.role === "ADVERTISER") {
        const next = onboardingStatus.advertiserCompleted ? "/dashboard/campaigns/new" : "/onboarding/advertiser";
        router.replace(next);
      } else {
        router.replace("/onboarding/role");
      }
      return;
    }

    if (!onboardingStatus.influencerCompleted) {
      router.replace("/onboarding/influencer");
      return;
    }

    router.push(`/campaigns/${campaignId}/apply`);
  }, [campaignId, isAuthenticated, onboardingStatus, router]);

  if (isLoading) return <p className="text-sm text-slate-500">불러오는 중...</p>;
  if (error || !data) return <p className="text-sm text-rose-500">캠페인을 불러올 수 없습니다.</p>;

  return (
    <article className="space-y-4">
      <div
        className="aspect-[3/2] w-full rounded-xl bg-slate-100"
        style={{ backgroundImage: `url(${data.coverImageUrl})`, backgroundSize: "cover" }}
      />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <p className="text-sm text-slate-600">
          {data.category} · {data.region}
        </p>
      </header>
      <section className="space-y-1">
        <h2 className="text-lg font-medium">혜택</h2>
        <p className="whitespace-pre-line text-slate-700">{data.benefitDesc}</p>
      </section>
      <section className="space-y-1">
        <h2 className="text-lg font-medium">미션</h2>
        <p className="whitespace-pre-line text-slate-700">{data.mission}</p>
      </section>
      <section className="grid grid-cols-2 gap-3 text-sm text-slate-700">
        <div>모집인원: {data.capacity}</div>
        <div>신청수: {data.applicationCount}</div>
        <div>
          기간: {data.startDate} ~ {data.endDate}
        </div>
        <div>선정 마감: {data.selectionDeadline ?? "-"}</div>
        <div>상태: {data.status}</div>
      </section>
      <div className="pt-4">
        <Button
          type="button"
          className="h-11 w-full text-base font-semibold"
          onClick={handleApply}
          disabled={isAuthenticated && statusLoading}
        >
          지원하기
        </Button>
      </div>
    </article>
  );
}


