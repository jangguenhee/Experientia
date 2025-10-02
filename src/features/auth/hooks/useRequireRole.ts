"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "../backend/schema";
import { useOnboardingStatusQuery } from "./useOnboardingGuards";

type TargetRole = Extract<UserRole, "ADVERTISER" | "INFLUENCER">;

type RequireRoleOptions = {
  skip?: boolean;
};

const resolveFallback = (role: TargetRole | null | undefined) => {
  if (role === "ADVERTISER") {
    return "/dashboard/campaigns/new";
  }

  if (role === "INFLUENCER") {
    return "/campaigns";
  }

  return "/onboarding/role";
};

export const useRequireRole = (
  target: TargetRole,
  options: RequireRoleOptions = {},
) => {
  const { skip = false } = options;
  const router = useRouter();
  const { data, isLoading, isSuccess } = useOnboardingStatusQuery({ enabled: !skip });
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    if (skip || isLoading || !isSuccess) {
      return;
    }

    if (!data) {
      router.replace("/onboarding/role");
      setCanProceed(false);
      return;
    }

    if (!data.hasProfile || data.role === null) {
      router.replace("/onboarding/role");
      setCanProceed(false);
      return;
    }

    if (data.role !== target) {
      router.replace(resolveFallback(data.role));
      setCanProceed(false);
      return;
    }

    if (target === "ADVERTISER" && !data.advertiserCompleted) {
      router.replace("/onboarding/advertiser");
      setCanProceed(false);
      return;
    }

    if (target === "INFLUENCER" && !data.influencerCompleted) {
      router.replace("/onboarding/influencer");
      setCanProceed(false);
      return;
    }

    setCanProceed(true);
  }, [data, isLoading, isSuccess, router, skip, target]);

  return useMemo(
    () => ({
      canProceed,
      status: data,
      isChecking: skip ? false : isLoading || !isSuccess || !canProceed,
    }),
    [canProceed, data, isLoading, isSuccess, skip],
  );
};

