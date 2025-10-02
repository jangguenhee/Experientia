"use client";

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { CampaignFeedResponseSchema } from "../lib/dto";
import type { CampaignFeedResponse } from "../lib/dto";

type Params = {
  category?: string;
  region?: string;
  sort: "latest" | "popular";
};

export function useCampaignListQuery(params: Params) {
  return useInfiniteQuery<
    CampaignFeedResponse,
    Error,
    InfiniteData<CampaignFeedResponse>,
    ["campaigns", Params],
    string | null
  >({
    queryKey: ["campaigns", params],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get("/api/campaigns", {
        params: {
          ...params,
          cursor: pageParam ?? null,
        },
      });
      return CampaignFeedResponseSchema.parse(res.data);
    },
    getNextPageParam: (last) => last.nextCursor ?? null,
  });
}
