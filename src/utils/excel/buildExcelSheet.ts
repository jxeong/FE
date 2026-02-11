import type { InsightItem } from "../../App";
import {
  fetchTop1BestSellerAIContext,
  fetchRisingProductItemAIContext,
} from "../../api/dashboard";
import { fetchCurrentRanking } from "../../api/rankings";
import { CATEGORY_MAP } from "../../components/RankingHistory"; 

export async function buildExcelSheetData(
  item: InsightItem
): Promise<any[][]> {
    const kind = item.meta?.kind ?? item.uniqueKey;

    switch (kind) {
        case "dashboard-stat-sales": {
            return [
                ["지난 달 총 판매량"],
                ["값", item.data?.value ?? "-"],
                ["변화", item.data?.change ?? "-"],
                ["추세", item.data?.trend ?? "-"],
            ];
            }

        case "dashboard-stat-revenue": {
            return [
                ["지난 달 매출액"],
                ["값", item.data?.value ?? "-"],
                ["변화", item.data?.change ?? "-"],
                ["추세", item.data?.trend ?? "-"],
            ];
            }
        case "dashboard-product-of-month": {
            const res = await fetchTop1BestSellerAIContext(item.meta?.month);
            const it = res?.result?.item ?? res?.item ?? res;

            return [
                ["지난 달 매출 1위"],
                ["제품명", it?.product_name ?? "-"],
                ["평점", it?.rating ?? "-"],
                ["리뷰 수", it?.review_count ?? "-"],
                ["순위 변동", it?.rank_change === 0 ? 0 : "-"],
            ];
        }

        case "dashboard-rising-product": {
            const res = await fetchRisingProductItemAIContext(item.meta?.month);
            const it = res?.result?.item ?? res?.item ?? res;

            return [
                ["급상승한 제품"],
                ["제품명", it?.product_name ?? "-"],
                ["평점", it?.rating ?? "-"],
                ["리뷰 수", it?.review_count ?? "-"],
                ["성장률", it?.growth_rate ?? "-"], 
            ];
        }

        case "dashboard-chart-monthly-sales": {
            const rows = Array.isArray(item.data) ? item.data : [];
            if (rows.length === 0) {
                return [["지난 달 판매 추이"], [], ["데이터 없음"]];
            }

            const headers = Object.keys(rows[0]); // 예: date, sales
            return [
                ["지난 달 판매 추이"],
                [],
                headers,
                ...rows.map((r) => headers.map((h) => r?.[h] ?? "")),
            ];
        }

        case "dashboard-table-top5": {
            const rows = Array.isArray(item.data) ? item.data : [];

            return [
                ["지난 달 베스트 셀러 TOP 5"],
                [],
                ["순위", "제품명", "판매량", "평점", "리뷰 수"],
                ...rows.map((r: any) => [
                r?.rank ?? "-",
                r?.name ?? "-",
                r?.sales ?? "-",
                r?.rating ?? "-",
                r?.reviews ?? "-",
                ]),
            ];
        }

        case "dashboard-table-product-detail": {
            const rows = Array.isArray(item.data) ? item.data : [];

            const formatRankChange = (v: number | undefined | null) => {
                if (v === 0) return "0";
                if (typeof v === "number" && v > 0) return `+${v}`;
                if (typeof v === "number" && v < 0) return `-${v}`;
                return "-";
            };

            return [
                ["지난 달 베스트 셀러 TOP 5 상세 정보"],
                [],
                ["순위", "제품명", "지난 달 판매량", "지난달 순위", "순위 변동"],
                ...rows.map((r: any) => [
                    r?.rank ?? "-",
                    r?.name ?? "-",
                    r?.sales ?? "-",
                    r?.prevRank ?? "-",
                    formatRankChange(
                        r?.rankChange ?? r?.rank_change
                    ),
                ]),
            ];
        }

        case "ranking-table-current": {
            const categoryCode = (item.meta as any)?.categoryCode as keyof typeof CATEGORY_MAP | undefined;
            const categoryId =
                (item.meta as any)?.categoryId ??
                (categoryCode ? CATEGORY_MAP[categoryCode] : undefined);

            // meta 없으면 item.data fallback
            let rows: any[] = Array.isArray(item.data) ? item.data : [];
            let snapshotTime: string | null = null;

            if (categoryId) {
                try {
                const res = await fetchCurrentRanking(categoryId);
                const result = res?.result ?? res;

                snapshotTime = result?.snapshot_time ?? null;
                rows = res?.result?.items ?? rows;
                } catch {
                    rows = Array.isArray(item.data) ? item.data : [];
                }
            }

            const categoryLabelMap: Record<string, string> = {
                all_beauty: "전체",
                lip_care: "립 케어",
                skin_care: "스킨 케어",
                lip_makeup: "립 메이크업",
                face_powder: "페이스 파우더",
            };

            const categoryLabel = categoryCode ? (categoryLabelMap[categoryCode] ?? categoryCode) : "-";

            const formatChange = (v: any) => {
                if (typeof v !== "number") return "-";
                if (v > 0) return `+${v}`;
                if (v < 0) return `-${Math.abs(v)}`;
                return "-"; // 0은 UI처럼 '-'로
            };

            const formatPrevRank = (v: any) =>
                typeof v === "number" ? `${v}위` : "-";

            return [
                ["실시간 아마존 현재 순위"],
                ["카테고리", categoryLabel],
                ["스냅샷 시각", snapshotTime ?? "-"],
                ["생성 시각", new Date().toLocaleString("ko-KR")],
                [],
                ["순위", "브랜드", "제품명", "이전 순위", "변동"],
                ...rows.slice(0, 30).map((r: any) => {
                const brand = r?.product_name?.split(" ")?.[0] ?? "-";
                return [
                    r?.rank ?? "-",
                    brand,
                    r?.product_name ?? "-",
                    formatPrevRank(r?.prev_rank),
                    formatChange(r?.rank_change),
                ];
                }),
            ];
        }

        case "ranking-chart-trend": {
            const rows = Array.isArray(item.data) ? item.data : [];

            const title = item.title || "LANEIGE 제품 순위 변동 추이";

            if (rows.length === 0) return [[title], [], ["데이터 없음"]];

            return [
                [title],
                ["기간", (item.meta as any)?.period ?? "-"],
                ["생성 시각", new Date().toLocaleString("ko-KR")],
                [],
                ["날짜", "전체 카테고리", "전체 순위", "선택 카테고리", "카테고리 순위"],
                ...rows.map((r: any) => [
                r?.date ?? "-",
                r?.overallCategory ?? "-",
                r?.overallRank ?? "-",
                r?.categoryCategory ?? "-",
                r?.categoryRank ?? "-",
                ]),
            ];
        }

        case "review-customer-feedback": {
            const data = item.data ?? {};

            return [
                [item.title],
                [],
                ["긍정 반응 비율", data?.positive_pct != null ? `${data.positive_pct}%` : "-"],
                [],
                ["고객 리뷰 요약"],
                [data?.customers_say ?? "-"],
            ];
        }

        case "review-sentiment-distribution": {
            const data = item.data ?? {};

            return [
                [item.title],
                [],
                ["구분", "비율(%)"],
                ["긍정", data?.positive_pct ?? "-"],
                ["부정", data?.negative_pct ?? "-"],
            ];
        }

        case "review-rating-index": {
            const data = item.data ?? {};

            return [
                [item.title],
                [],
                ["신뢰도 점수", data?.score ?? "-"],
                ["평점", data?.rating ?? "-"],
                ["리뷰 개수", data?.review_count?.toLocaleString() ?? "-"],
            ];
        }

        case "review-rating-distribution": {
            const rows = Array.isArray(item.data) ? item.data : [];

            return [
                [item.title],
                [],
                ["별점", "비율(%)"],
                ...rows.map((r: any) => [
                `${r.star}점`,
                r.pct ?? "-",
                ]),
            ];
        }

        case "review-ai-insights": {
            const rows = Array.isArray(item.data) ? item.data : [];

            return [
                [item.title],
                [],
                ["키워드", "언급 수", "점수", "AI 해석"],
                ...rows.map((r: any) => [
                r?.aspect_name ?? "-",
                r?.mention_total ?? "-",
                r?.score ?? "-",
                r?.summary ?? "-",
                ]),
            ];
        }

        case "keyword-category-distribution": {
            const obj = item.data ?? {};
            const entries = Object.entries(obj);

            return [
                ["카테고리별 키워드 분포"],
                [],
                ["카테고리", "언급 수"],
                ...entries.map(([category, value]) => [category, value]),
            ];
        }

        case "keyword-rankings-table": {
            const rows = Array.isArray(item.data) ? item.data : [];

            return [
                ["키워드 순위"],
                [],
                ["순위", "키워드", "언급 수", "트렌드", "변화율", "감정", "카테고리"],
                ...rows.map((r: any) => [
                r?.rank ?? "-",
                r?.keyword ?? "-",
                r?.mentions ?? "-",
                r?.trend ?? "-",
                typeof r?.change === "number" ? `${r.change}%` : "-",
                r?.sentiment ?? "-",
                r?.category ?? "-",
                ]),
            ];
        }

        default:
            return [[item.title], ["지원하지 않는 카드", kind]];
  
    }
}