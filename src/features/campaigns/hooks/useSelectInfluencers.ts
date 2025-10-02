"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { z } from "zod";

export function useSelectInfluencers(campaignId: string) {
  return useMutation({
    mutationFn: async (input: { selectedApplicationIds: string[]; waitlistApplicationIds?: string[] }) => {
      const res = await apiClient.post(`/api/campaigns/${campaignId}/select`, input);
      return z.object({ updated: z.number().int().nonnegative() }).parse(res.data);
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "선정 업데이트 실패"));
    },
  });
}


