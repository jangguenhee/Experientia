"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { CreateCampaignSchema, type CreateCampaignInput } from "../backend/schema";
import { z } from "zod";

export function useCreateCampaign() {
  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const body = CreateCampaignSchema.parse(input);
      const res = await apiClient.post("/api/campaigns", body);
      return z.object({ id: z.string().uuid() }).parse(res.data);
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "캠페인 생성 실패"));
    },
  });
}


