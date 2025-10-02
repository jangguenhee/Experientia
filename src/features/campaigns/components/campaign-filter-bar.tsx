"use client";

import { useMemo } from "react";
import { useCampaignFilterStore } from "../store/filter-store";
import { categoryOptions, regionOptions, sortOptions } from "../constants/filters";

export function CampaignFilterBar() {
  const { category, region, sort, setCategory, setRegion, setSort, reset } = useCampaignFilterStore();
  const categoryList = useMemo(() => categoryOptions, []);
  const regionList = useMemo(() => regionOptions, []);
  const sortList = useMemo(() => sortOptions, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select className="rounded-md border px-3 py-2" value={category ?? ""} onChange={(e) => setCategory(e.target.value || undefined)}>
        <option value="">카테고리</option>
        {categoryList.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select className="rounded-md border px-3 py-2" value={region ?? ""} onChange={(e) => setRegion(e.target.value || undefined)}>
        <option value="">지역</option>
        {regionList.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select className="rounded-md border px-3 py-2" value={sort} onChange={(e) => setSort(e.target.value as any)}>
        {sortList.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button onClick={reset} className="rounded-md border px-3 py-2">필터 초기화</button>
    </div>
  );
}



