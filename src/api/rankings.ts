// src/api/rankings.ts
import { API_BASE_URL } from "../config/api";

// [1] 아마존 베스트셀러 순위 API
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

// [2] 아마존 라네즈 제품 리스트 조회
export interface LaneigeProductRaw {
  image_url: string;
  product_name: string;
  style: string;
  rank_1: number;
  rank_2: number;
  rank_1_category: string;
  rank_2_category: string;
}

export interface LaneigeProductUI {
  name: string;
  style: string;
  imageUrl: string;
  rank1: number;
  rank2: number;
  rank1Category: string;
  rank2Category: string;
}

export interface LaneigeProductsResponse {
  snapshot_time: string;
  items: LaneigeProductRaw[];
}

export async function fetchCurrentProducts(): Promise<{
  snapshot_time: string;
  items: LaneigeProductUI[];
}> {
  const res = await fetch(`${API_BASE_URL}/api/laneige/products`);

  if (!res.ok) {
    throw new Error("Failed to fetch laneige products");
  }

  const data = (await res.json()) as LaneigeProductsResponse;

  return {
    snapshot_time: data.snapshot_time,
    items: data.items.map(mapLaneigeProductToUI),
  };
}

function normalizeProductName(name: string): string {
  return name
    .split(/[-–:+]/)[0]
    .replace(/^laneige\s+/i, "")
    .trim();
}

export function mapLaneigeProductToUI(
  raw: LaneigeProductRaw
): LaneigeProductUI {
  return {
    name: normalizeProductName(raw.product_name),
    imageUrl: raw.image_url,
    style: raw.style,
    rank1: raw.rank_1,
    rank2: raw.rank_2,
    rank1Category: raw.rank_1_category,
    rank2Category: raw.rank_2_category,
  };
}

