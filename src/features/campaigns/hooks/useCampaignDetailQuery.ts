"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { CampaignDetailSchema } from "../lib/dto";

export function useCampaignDetailQuery(campaignId?: string) {
  return useQuery({
    queryKey: ["campaign", campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const res = await apiClient.get(`/api/campaigns/${campaignId}`);
      return CampaignDetailSchema.parse(res.data);
    },
  });
}



