"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import {
  CreateAdvertiserSchema,
  CreateInfluencerSchema,
  CreateProfileSchema,
  type CreateAdvertiserInput,
  type CreateInfluencerInput,
  type CreateProfileInput,
} from "../backend/schema";
import {
  onboardingStatusQueryKey,
  useOnboardingStatusQuery,
} from "./useOnboardingGuards";

export function useOnboardingStatus() {
  return useOnboardingStatusQuery();
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      const body = CreateProfileSchema.parse(input);
      const res = await apiClient.post("/api/auth/onboarding/profile", body);
      return res.data as { ok: true };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: onboardingStatusQueryKey });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "프로필 생성 실패"));
    },
  });
}

export function useCreateAdvertiser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAdvertiserInput) => {
      const body = CreateAdvertiserSchema.parse(input);
      const res = await apiClient.post("/api/auth/onboarding/advertiser", body);
      return z.object({ id: z.string().uuid() }).parse(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: onboardingStatusQueryKey });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "광고주 정보 생성 실패"));
    },
  });
}

export function useCreateInfluencer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInfluencerInput) => {
      const body = CreateInfluencerSchema.parse(input);
      const res = await apiClient.post("/api/auth/onboarding/influencer", body);
      return z.object({ id: z.string().uuid() }).parse(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: onboardingStatusQueryKey });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "인플루언서 정보 생성 실패"));
    },
  });
}
