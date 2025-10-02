"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { z } from "zod";

export function useCloseCampaign() {
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiClient.post(`/api/campaigns/${campaignId}/close`);
      return z.object({ id: z.string().uuid(), status: z.literal('CLOSED') }).parse(res.data);
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "모집 종료 실패"));
    },
  });
}


