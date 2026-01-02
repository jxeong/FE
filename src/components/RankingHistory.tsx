import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { TooltipProps } from "recharts";
import type { InsightItem } from "../App";
import "../styles/RankingHistory.css";
import { fetchCurrentRanking } from "../api/rankings";

export const CATEGORY_MAP = {
  all_beauty: 1,
  lip_care: 2,
  skin_care: 3,
  lip_makeup: 4,
  face_powder: 5,
} as const;
export type CategoryCode = keyof typeof CATEGORY_MAP;

function RankingTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="ranking-tooltip">
      <div className="ranking-tooltip__date">{label}</div>

      {payload.map((item) => (
        <div
          key={item.dataKey as string}
          className={`ranking-tooltip__row ${
            item.dataKey === "overall_rank" ? "is-overall" : "is-category"
          }`}
        >
          <span className="ranking-tooltip__label">{item.name}:</span>
          <span className="ranking-tooltip__value">{item.value}위</span>
        </div>
      ))}
    </div>
  );
}

/* 선택 카테고리 타입 */
type PeriodType = "weekly" | "monthly" | "yearly";
type CategoryType =
  | "all_beauty"
  | "lip_care"
  | "skin_care"
  | "lip_makeup"
  | "face_powder";

/* 더미데이터 (백엔드 연동 대비) */
const laneigeProducts = [
  {
    name: "Water Sleeping Mask",
    imageUrl: "https://m.media-amazon.com/images/I/61STtl3UBpL._SX466_.jpg",
    categories: { overall: 12, skincare: 3 },
  },
  {
    name: "Cream Skin Refiner",
    imageUrl: "https://m.media-amazon.com/images/I/51taxz9F+xL._SX466_.jpg",
    categories: { overall: 23, skincare: 8 },
  },
  {
    name: "Lip Sleeping Mask",
    imageUrl: "https://m.media-amazon.com/images/I/51DoE85QVZL._SX466_.jpg",
    categories: { overall: 8, lipcare: 2 },
  },
  {
    name: "Water Bank Moisture Cream",
    imageUrl: "https://m.media-amazon.com/images/I/61t9Wcz+t9L._SX466_.jpg",
    categories: { overall: 34, skincare: 12 },
  },
  {
    name: "Neo Cushion",
    imageUrl: "https://m.media-amazon.com/images/I/61++xhU0HjL._SX466_.jpg",
    categories: { overall: 45, facepowder: 5 },
  },
];

/* =======================
   Config
======================= */

const periodConfigs = {
  weekly: { label: "이번 주", points: 7 },
  monthly: { label: "이번 달", points: 30 },
  yearly: { label: "올해", points: 12 },
};

/* =======================
   Utils
======================= */

const generateRankingData = (period: PeriodType, productName: string) => {
  const product = laneigeProducts.find((p) => p.name === productName);
  if (!product) return [];

  const points = periodConfigs[period].points;
  const now = new Date();
  const categories = Object.keys(product.categories) as CategoryType[];

  const data: any[] = [];

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const entry: any = {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
    };

    categories.forEach((cat) => {
      const base = product.categories[cat];
      const variation = Math.floor(Math.sin(i / 3) * 5);
      entry[`${cat}_rank`] = Math.max(1, base + variation);
    });

    data.push(entry);
  }

  return data;
};

/* =======================
   Props
======================= */

interface RankingHistoryProps {
  addToCart: (item: Omit<InsightItem, "id" | "timestamp">) => void;
  removeByUniqueKey: (uniqueKey: string) => void;
  isInCart: (uniqueKey: string) => boolean;
}

/* =======================
   Component
======================= */

export function RankingHistory({
  addToCart,
  removeByUniqueKey,
  isInCart,
}: RankingHistoryProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType>("all_beauty");
  const categoryId = CATEGORY_MAP[selectedCategory];

  // 순위 데이터 상태
  type RankingItem = {
    rank: number;
    product_name: string;
    is_laneige: boolean;
    prev_rank: number;
    rank_change: number;
  };

  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryConfigs: Record<CategoryType, { label: string }> = {
    all_beauty: { label: "전체" },
    lip_care: { label: "립 케어" },
    skin_care: { label: "스킨 케어" },
    lip_makeup: { label: "립 메이크업" },
    face_powder: { label: "페이스 파우더" },
  };

  const tableKey = `ranking-table-amazon-${selectedCategory}`;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(
    laneigeProducts[0].name
  );
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [scrollX, setScrollX] = useState(0);

  const filteredProducts = laneigeProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const chartData = generateRankingData(period, selectedProduct);
  const selectedProductData = laneigeProducts.find(
    (p) => p.name === selectedProduct
  );
  const categoryKeys = selectedProductData
    ? (Object.keys(selectedProductData.categories) as CategoryType[])
    : [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const categoryId = CATEGORY_MAP[selectedCategory];
        const res = await fetchCurrentRanking(categoryId);
        setRankings(res.items);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedCategory]);

  const handleScroll = (dir: "left" | "right") => {
    const el = document.getElementById("ranking-product-scroll");
    if (!el) return;

    const delta = dir === "left" ? -300 : 300;
    const next = Math.max(0, scrollX + delta);
    el.scrollTo({ left: next, behavior: "smooth" });
    setScrollX(next);
  };

  return (
    <div className="ranking-history">
      {/* ============== 실시간 아마존 현재 순위 ============== */}
      <section className="ranking-card ranking-card--amazon">
        <header className="ranking-card__header ranking-card__header--amazon">
          {/* 좌측: 제목 + 카테고리 */}
          <div className="ranking-card__header-left">
            <h2 className="ranking-card__title">실시간 아마존 현재 순위</h2>

            <div className="ranking-card__category-group">
              {(Object.keys(categoryConfigs) as CategoryType[]).map(
                (category) => (
                  <button
                    key={category}
                    className={`ranking-card__category-btn ${
                      selectedCategory === category ? "is-active" : ""
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {categoryConfigs[category].label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 우측: 검색 + 담기 버튼 */}
          <div className="ranking-card__header-right">
            <div className="ranking-card__search">
              <Search className="ranking-card__search-icon" />
              <input
                className="ranking-card__search-input"
                placeholder="제품 또는 브랜드 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <AddToCartButton
              onAdd={() =>
                addToCart({
                  type: "table",
                  title: `아마존 ${categoryConfigs[selectedCategory].label} 베스트셀러 순위`,
                  data: null,
                  page: "ranking",
                  uniqueKey: tableKey,
                })
              }
              onRemove={() => removeByUniqueKey(tableKey)}
              isInCart={isInCart(tableKey)}
            />
          </div>
        </header>

        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>브랜드</th>
                <th>제품명</th>
                <th>이전 순위</th>
                <th>변동</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>로딩 중...</td>
                </tr>
              ) : (
                rankings.slice(0, 30).map((item) => (
                  <tr
                    key={item.rank}
                    className={`ranking-table__row ${
                      item.is_laneige ? "ranking-table__row--laneige" : ""
                    }`}
                  >
                    <td>
                      <span
                        className={`ranking-badge ${
                          item.is_laneige ? "ranking-badge--laneige" : ""
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>

                    {/* 브랜드 정보 없음 */}
                    <td>{item.product_name.split(" ")[0]}</td>

                    <td>{item.product_name}</td>

                    <td className="prev-rank">{item.prev_rank}위</td>

                    <td className="rank-change">
                      {item.rank_change > 0 && (
                        <span className="rank-up">▲ +{item.rank_change}</span>
                      )}
                      {item.rank_change < 0 && (
                        <span className="rank-down">
                          ▼ {Math.abs(item.rank_change)}
                        </span>
                      )}
                      {item.rank_change === 0 && (
                        <span className="rank-neutral">변동 없음</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= 라네즈 제품 차트 ================= */}
      
    </div>
  );
}
