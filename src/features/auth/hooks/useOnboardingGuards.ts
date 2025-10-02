"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage, isAxiosError } from "@/lib/remote/api-client";
import {
  OnboardingStatusSchema,
  type OnboardingStatus,
} from "../backend/schema";

export const onboardingStatusQueryKey = [
  "auth",
  "onboarding",
  "status",
] as const;

const createEmptyStatus = (): OnboardingStatus => ({
  hasProfile: false,
  role: null,
  advertiserCompleted: null,
  influencerCompleted: null,
});

export const fetchOnboardingStatus = async (): Promise<OnboardingStatus> => {
  try {
    const res = await apiClient.get("/api/auth/onboarding/status");
    return OnboardingStatusSchema.parse(res.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return createEmptyStatus();
    }

    throw new Error(
      extractApiErrorMessage(error, "온보딩 상태를 확인하지 못했습니다."),
    );
  }
};

type UseOnboardingStatusQueryOptions = Omit<
  UseQueryOptions<OnboardingStatus, Error, OnboardingStatus>,
  "queryKey" | "queryFn"
>;

export const useOnboardingStatusQuery = (
  options?: UseOnboardingStatusQueryOptions,
) => {
  const query = useQuery({
    queryKey: onboardingStatusQueryKey,
    queryFn: fetchOnboardingStatus,
    staleTime: 60_000,
    retry: false,
    ...options,
  });

  return query;
};

export const useOnboardingStatusSafe = () => {
  const { data, isLoading, isError } = useOnboardingStatusQuery();

  return useMemo(
    () => ({ status: data ?? createEmptyStatus(), isLoading, isError }),
    [data, isError, isLoading],
  );
};

