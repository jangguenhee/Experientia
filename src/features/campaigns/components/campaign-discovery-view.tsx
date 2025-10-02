"use client";

import { useMemo } from "react";
import { CampaignFilterBar } from "./campaign-filter-bar";
import { useCampaignFilterStore } from "../store/filter-store";
import { useCampaignListQuery } from "../hooks/useCampaignListQuery";
import { CampaignCard } from "./campaign-card";

export function CampaignDiscoveryView() {
  const { category, region, sort } = useCampaignFilterStore();
  const params = useMemo(() => ({ category, region, sort }), [category, region, sort]);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCampaignListQuery(params);

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  return (
    <div className="space-y-6">
      <CampaignFilterBar />
      {isLoading ? (
        <p className="text-sm text-slate-500">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">조건에 맞는 캠페인이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CampaignCard key={item.id} item={item} />
            ))}
          </div>
          {hasNextPage ? (
            <div className="flex justify-center">
              <button disabled={isFetchingNextPage} onClick={() => fetchNextPage()} className="mt-4 rounded-md border px-4 py-2">
                {isFetchingNextPage ? '더 불러오는 중...' : '더 불러오기'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}



