// src/api/rankings.ts
import { API_BASE_URL } from "../config/api";

export interface RankingItemRaw {
  rank: number;
  product_name: string;
  is_laneige: boolean;
  prev_rank: number;
  rank_change: number;
}

export interface CurrentRankingResponse {
  category_id: number;
  snapshot_time: string;
  items: RankingItemRaw[];
}

export async function fetchCurrentRanking(categoryId: number) {
  const res = await fetch(
    `${API_BASE_URL}/api/rankings/current?category=${categoryId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch current ranking");
  }

  return res.json() as Promise<CurrentRankingResponse>;
}
