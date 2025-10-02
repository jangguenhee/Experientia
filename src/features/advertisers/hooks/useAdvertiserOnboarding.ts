"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

const StatusSchema = z.object({
  hasProfile: z.boolean(),
  role: z.union([z.literal("ADVERTISER"), z.literal("INFLUENCER")]).nullable(),
  advertiserCompleted: z.boolean().nullable(),
  influencerCompleted: z.boolean().nullable(),
});

const CreateAdvertiserResponse = z.object({ id: z.string().uuid() });

export const AdvertiserOnboardingInputSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1),
  phone: z.string().min(7),
  companyName: z.string().min(1),
  businessNumber: z.string().min(5),
  representative: z.string().min(1),
  storePhone: z.string().min(5),
  address: z.string().min(1),
});

export type AdvertiserOnboardingInput = z.infer<typeof AdvertiserOnboardingInputSchema>;

export function useAdvertiserStatusQuery() {
  return useQuery({
    queryKey: ["auth", "onboarding", "status"],
    queryFn: async () => {
      const res = await apiClient.get("/api/auth/onboarding/status");
      return StatusSchema.parse(res.data);
    },
    staleTime: 60_000,
  });
}

export function useCreateAdvertiser() {
  return useMutation({
    mutationFn: async (input: AdvertiserOnboardingInput) => {
      const payload = AdvertiserOnboardingInputSchema.parse(input);
      const res = await apiClient.post("/api/auth/onboarding/advertiser", payload);
      return CreateAdvertiserResponse.parse(res.data);
    },
    onError: (err) => {
      throw new Error(extractApiErrorMessage(err, "광고주 정보 저장 실패"));
    },
  });
}
