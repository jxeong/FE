import { API_BASE_URL } from "../config/api";

export interface CustomersSay {
  review_count: number;
  current_text: string;
  highlight: string;
  updated_at: string;
}

export interface Reputation {
  score: number;
  rating: number;
  review_count: number;
}

export interface Sentiment {
  positive_pct: number;
  negative_pct: number;
}

export interface RatingDistItem {
  star: number;
  pct: number;
}

export interface KeywordInsight {
  aspect_name: string;
  mention_total: number;
  score: number;
  summary: string;
  mention_positive: number;
  mention_negative: number;
}

export interface ReviewAnalysisResponse {
  product_id: number;
  snapshot_time: string;
  customers_say: CustomersSay;
  reputation: Reputation;
  sentiment: Sentiment;
  rating_distribution: RatingDistItem[];
  keyword_insights: KeywordInsight[];
}

export async function fetchProductReviewAnalysis(productId: number): Promise<ReviewAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/api/laneige/products/${productId}/review-analysis`);
  if (!res.ok) {
    throw new Error("Failed to fetch review analysis");
  }
  return res.json() as Promise<ReviewAnalysisResponse>;
}
