"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStatus } from "@/features/auth/hooks/useOnboarding";

type OnboardingIndexPageProps = {
  params: Promise<Record<string, never>>;
};

export default function OnboardingIndexPage({ params }: OnboardingIndexPageProps) {
  void params;
  const router = useRouter();
  const { data, isLoading } = useOnboardingStatus();

  useEffect(() => {
    if (isLoading || !data) return;

    if (!data.hasProfile || !data.role) {
      router.replace("/onboarding/role");
      return;
    }

    if (data.role === "ADVERTISER") {
      if (!data.advertiserCompleted) {
        router.replace("/onboarding/advertiser");
        return;
      }
      router.replace("/dashboard/campaigns/new");
      return;
    }

    if (data.role === "INFLUENCER") {
      if (!data.influencerCompleted) {
        router.replace("/onboarding/influencer");
        return;
      }
      router.replace("/campaigns");
    }
  }, [data, isLoading, router]);

  return null;
}
