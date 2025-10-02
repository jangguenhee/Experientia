"use client";

import { create } from "zustand";

type FiltersState = {
  category?: string;
  region?: string;
  sort: "latest" | "popular";
  setCategory: (v?: string) => void;
  setRegion: (v?: string) => void;
  setSort: (v: "latest" | "popular") => void;
  reset: () => void;
};

export const useCampaignFilterStore = create<FiltersState>((set) => ({
  category: undefined,
  region: undefined,
  sort: "latest",
  setCategory: (v) => set({ category: v }),
  setRegion: (v) => set({ region: v }),
  setSort: (v) => set({ sort: v }),
  reset: () => set({ category: undefined, region: undefined, sort: "latest" }),
}));



