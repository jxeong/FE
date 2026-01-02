// src/api/dashboard.ts
import { API_BASE_URL } from "../config/api";

// [1] Dash-베스트셀러 top5 목록
export interface BestSellerItemRaw {
  rank: number;
  product_id: number;
  image_url: string;
  product_name: string;
  last_month_sales: number;
  rating: number;
  review_count: number;
  prev_month_rank: number;
  rank_change: number;
}

export interface BestSellerTop5ApiResponse {
  month: string;
  snapshot_time: string;
  items: BestSellerItemRaw[];
}

export interface BestSellerTop5Row {
  rank: number;
  name: string;
  sales: number;
  rating: number;
  reviews: number;
}

export async function fetchTop5Bestsellers(month: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/dashboard/bestsellers/top5?month=${month}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top5 bestsellers");
  }

  return res.json();
}

// [2] Dash-베스트셀러 top5 세부정보
export interface ProductDetailRow {
  rank: number;
  name: string;
  sales: number;
  prevRank: number;
  rankChange: number;
}

function mapProductDetail(raw: BestSellerItemRaw[]): ProductDetailRow[] {
  return raw.map((item) => ({
    rank: item.rank,
    name: item.product_name,
    sales: item.last_month_sales,
    prevRank: item.prev_month_rank,
    rankChange: item.rank_change,
  }));
}

// [3] 매출 1위 제품
export interface Top1BestSellerItemRaw {
  rank: number;
  product_id: number;
  image_url: string;
  product_name: string;
  rating: number;
  review_count: number;
  rank_change: number;
}

export interface Top1BestSellerResponse {
  month: string;
  snapshot_time: string;
  items: Top1BestSellerItemRaw;
}

function normalizeProductName(name: string): string {
  return name.split(/[-–:|]/)[0].trim();
}

export async function fetchTop1BestSeller(month: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/dashboard/bestsellers/top1?month=${month}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top1 bestseller");
  }

  const data = await res.json();
  const raw = data.item;

  return {
    title: normalizeProductName(raw.product_name),
    imageUrl: raw.image_url,
    rating: raw.rating,
    reviewCount: raw.review_count,
    growth: `순위 ${raw.rank_change}위 상승`,
  };
}

// [3] 매출 1위 제품 - AI 컨텍스트용 인터페이스
export interface Top1BestSellerAIContext {
  month: string;
  product_name: string;
  rank: number;
  last_month_sales: number;
  rating: number;
  review_count: number;
}

export async function fetchTop1BestSellerAIContext(month: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/dashboard/bestsellers/top1?month=${month}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top1 bestseller");
  }

  const data = await res.json();

  const raw =
    data?.item ??
    data?.items ??
    data?.data?.item ??
    data?.data?.items ??
    null;

  if (!raw) {
    console.error("[Top1 AI] raw is undefined", data);
    return null;
  }

  return {
    month: data.month ?? data.data?.month,
    product_name: raw.product_name,
    rank: raw.rank,
    last_month_sales: raw.last_month_sales,
    rating: raw.rating,
    review_count: raw.review_count,
  };
}


// [4] 급상승  제품
export interface RisingProductItemRaw {
  image_url: string;
  product_name: string;
  rating: number;
  review_count: number;
  rank_change: number;
  growth_rate: string;
}

export interface RisingProductApiResponse {
  snapshot_time: string;
  items: RisingProductItemRaw[];
}

export async function fetchRisingProduct() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/rising`);

  if (!res.ok) {
    throw new Error("Failed to fetch rising product");
  }

  const data = await res.json();
  const raw = data.item;

  if (!raw) {
    console.warn("rising raw item is empty", data);
    return null;
  }

  return {
    title: raw.product_name.split(/[-–:|]/)[0].trim(),
    imageUrl: raw.image_url,
    rating: raw.rating,
    reviewCount: raw.review_count,
    growth: raw.growth_rate,
    trend: raw.rank_change > 0 ? "up" : "down",
  };
}

// [4] 급상승  제품 - AI 컨텍스트용 인터페이스
export interface RisingProductItemAIContext {
  product_name: string;
  rating: number;
  review_count: number;
  growth_rate: string;
}

export async function fetchRisingProductItemAIContext(month: string) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/rising`);

  if (!res.ok) {
    throw new Error("Failed to fetch rising product");
  }

  const data = await res.json();

  const raw =
    data?.item ??
    data?.items ??
    data?.data?.item ??
    data?.data?.items ??
    null;

  if (!raw) {
    console.error("[Top1 AI] raw is undefined", data);
    return null;
  }

  return {
    product_name: raw.product_name,
    rating: raw.rating,
    review_count: raw.review_count,
    growth_rate: raw.growth_rate,
  };
}