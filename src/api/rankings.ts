// src/api/rankings.ts
import { API_BASE_URL } from "../config/api";

// [1] 아마존 베스트셀러 순위 API
export interface RankingItemRaw {
  rank: number;
  product_name: string;
  is_laneige: boolean;
  prev_rank: number | null;
  rank_change: number;
}

export interface CurrentRankingResponse {
  category_id: number;
  snapshot_time: string;
  items: RankingItemRaw[];
}

export const AMAZON_CATEGORY_ID_MAP: Record<AmazonCategory, number> = {
  all_beauty: 1,
  lip_care: 2,
  skin_care: 3,
  lip_makeup: 4,
  face_powder: 5,
};


export async function fetchCurrentRanking(categoryId: number) {
  const res = await fetch(
    `${API_BASE_URL}/api/rankings/current?category=${categoryId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch current ranking");
  }

  const data = await res.json();
  return data.result as CurrentRankingResponse;
}

// AI 전달용: 현재 랭킹 → lines
export function mapCurrentRankingToAILines(
  categoryKey: string,
  data: CurrentRankingResponse
): string[] {
  const lines: string[] = [];

  lines.push(`category: ${categoryKey}`);
  lines.push(`snapshot_time: ${data.snapshot_time}`);

  data.items.forEach((item) => {
    const name = item.product_name
      .split(/[-–:+|]/)[0]
      .trim();

    const rankChange =
      item.rank_change > 0
        ? `+${item.rank_change}`
        : `${item.rank_change}`;

    lines.push(
      `rank ${item.rank}: ${name} | ` +
        `is_laneige ${item.is_laneige} | ` +
        `rank_change ${rankChange}`
    );
  });

  return lines;
}

// [2] 아마존 라네즈 제품 리스트 조회
export interface LaneigeProductRaw {
  product_id: number;
  image_url: string;
  product_name: string;
  style: string;
  rank_1: number | null;
  rank_2: number | null;
  rank_1_category: string;
  rank_2_category: string;
}

export interface LaneigeProductUI {
  productId: number;
  name: string;
  style: string;
  imageUrl: string;
  rank1: number | null;
  rank2: number | null;
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

  const json = await res.json();
  const data = json.result;

  return {
    snapshot_time: data?.snapshot_time,
    items: (data?.items ?? []).map(mapLaneigeProductToUI),
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

  const data = await res.json();
  return data.result as RankTrendApiResponse;
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


// AI 채팅 전달용 함수
export function normalizeRankTrendApiToAI(data: {
  product_name: string;
  style?: string;
  range: string;
  items: {
    bucket: string;
    rank1?: number | null;
    rank1_category?: string | null;
    rank2?: number | null;
    rank2_category?: string | null;
  }[];
}) {
  return {
    product_name: data.product_name,
    style: data.style,
    range: data.range,
    items: data.items.map((item) => ({
      date: item.bucket,
      overallRank: item.rank1 ?? undefined,
      overallCategory: item.rank1_category ?? undefined,
      categoryRank: item.rank2 ?? undefined,
      categoryCategory: item.rank2_category ?? undefined,
    })),
  };
}

export function mapRankingHistoryToAILines(data: {
  product_name: string;
  style?: string;
  range: string;
  items: {
    date: string;
    overallRank?: number;
    overallCategory?: string;
    categoryRank?: number;
    categoryCategory?: string;
  }[];
}): string[] {
  const lines: string[] = [];

  lines.push(`product_name: ${data.product_name}`);

  if (data.style) {
    lines.push(`style: ${data.style}`);
  }

  lines.push(`range: ${data.range}`);

  data.items.forEach((item) => {
    const parts: string[] = [];

    if (item.overallRank != null) {
      parts.push(`overall ${item.overallRank} (${item.overallCategory})`);
    }

    if (item.categoryRank != null) {
      parts.push(`category ${item.categoryRank} (${item.categoryCategory})`);
    }

    if (parts.length === 0) {
      lines.push(`${item.date}: rank 없음`);
    } else {
      lines.push(`${item.date}: ${parts.join(", ")}`);
    }
  });

  return lines;
}

