"use client";

import Link from "next/link";
import type { CampaignCard as Card } from "../lib/dto";

export function CampaignCard({ item }: { item: Card }) {
  const appliedRate = Math.floor((item.applicationCount / item.capacity) * 100);

  return (
    <Link href={`/campaigns/${item.id}`} className="group block overflow-hidden rounded-xl border">
      <div className="aspect-[3/2] w-full bg-slate-100" style={{ backgroundImage: `url(${item.coverImageUrl})`, backgroundSize: 'cover' }} />
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 text-base font-semibold">{item.title}</h3>
          <span className="text-xs text-slate-500">D-day {item.endDate}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{item.category}</span>
          <span>·</span>
          <span>{item.region}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="rounded bg-slate-100 px-2 py-1">{appliedRate}% 모집율</span>
          <span className="rounded bg-slate-100 px-2 py-1">지원 {item.applicationCount}</span>
        </div>
      </div>
    </Link>
  );
}



