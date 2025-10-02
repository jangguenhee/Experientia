"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

// -----------------------------------------------------------------------------
// ✅ Schemas (exported for page usage)
// -----------------------------------------------------------------------------
export const AdvertiserOnboardingInputSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1), // YYYY-MM-DD
  phone: z.string().min(7),
  companyName: z.string().min(1),
  businessNumber: z.string().min(5),
  representative: z.string().min(1),
  storePhone: z.string().min(5),
  address: z.string().min(1),
});
export type AdvertiserOnboardingInput = z.infer<typeof AdvertiserOnboardingInputSchema>;

const OnboardingStatusSchema = z.object({
  hasProfile: z.boolean(),
  role: z.union([z.literal("ADVERTISER"), z.literal("INFLUENCER")]).nullable(),
  advertiserCompleted: z.boolean().nullable(),
  influencerCompleted: z.boolean().nullable(),
});
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

const CreateAdvertiserRespSchema = z.object({ id: z.string().uuid() });
export type CreateAdvertiserResp = z.infer<typeof CreateAdvertiserRespSchema>;

// -----------------------------------------------------------------------------
// ✅ Hooks (no JSX)
// -----------------------------------------------------------------------------
export function useAdvertiserStatusQuery() {
  return useQuery({
    queryKey: ["auth", "onboarding", "status"],
    queryFn: async (): Promise<OnboardingStatus> => {
      const { data } = await apiClient.get("/api/auth/onboarding/status");
      return OnboardingStatusSchema.parse(data);
    },
    staleTime: 60_000,
  });
}

export function useCreateAdvertiser() {
  return useMutation<CreateAdvertiserResp, Error, AdvertiserOnboardingInput>({
    mutationFn: async (input) => {
      const payload = AdvertiserOnboardingInputSchema.parse(input);
      try {
        const { data } = await apiClient.post("/api/auth/onboarding/advertiser", payload);
        return CreateAdvertiserRespSchema.parse(data);
      } catch (err: any) {
        // 일부 배포 환경에서 409를 반환해도 서버가 기존 레코드 id를 body로 줄 수 있으므로 파싱을 시도
        const maybeData = err?.response?.data;
        const parsed = CreateAdvertiserRespSchema.safeParse(maybeData);
        if (parsed.success) return parsed.data;
        throw new Error(extractApiErrorMessage(err, "광고주 정보 저장 실패"));
      }
    },
  });
}
