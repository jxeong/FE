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
  product_id: number;
  image_url: string;
  product_name: string;
  style: string;
  rank_1: number;
  rank_2: number;
  rank_1_category: string;
  rank_2_category: string;
}

export interface LaneigeProductUI {
  productId: number;
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
    productId: raw.product_id,
    name: normalizeProductName(raw.product_name),
    imageUrl: raw.image_url,
    style: raw.style,
    rank1: raw.rank_1,
    rank2: raw.rank_2,
    rank1Category: raw.rank_1_category,
    rank2Category: raw.rank_2_category,
  };
}

// [3] 라네즈 제품 순위 정보 조회 API
export type RankRange = "WEEK" | "MONTH" | "YEAR";

export interface RankTrendItem {
  bucket: string;
  rank1: number | null;
  rank1_category: string | null;
  rank2: number | null;
  rank2_category: string | null;
}

export interface RankChartPoint {
  date: string;

  overallRank?: number;
  overallCategory?: string;

  categoryRank?: number;
  categoryCategory?: string;
}


export interface RankTrendApiResponse {
  product_id: number;
  range: RankRange;
  items: RankTrendItem[];
}

export async function fetchProductRankTrends(
  productId: number,
  range: RankRange
): Promise<RankTrendApiResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/laneige/products/${productId}/rank-trends?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch product rank trends");
  }

  return res.json();
}

export interface RankChartPoint {
  date: string;
  overallRank?: number;
  categoryRank?: number;
}

export function mapRankTrendsToChartData(
  response: RankTrendApiResponse
): RankChartPoint[] {
  return response.items.map((item) => ({
    date: item.bucket,

    overallRank: item.rank1 ?? undefined,
    overallCategory: item.rank1_category ?? undefined,

    categoryRank: item.rank2 ?? undefined,
    categoryCategory: item.rank2_category ?? undefined,
  }));
}
