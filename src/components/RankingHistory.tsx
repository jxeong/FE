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
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { InsightItem } from "../App";
import "../styles/RankingHistory.css";
import { fetchCurrentRanking, fetchCurrentProducts } from "../api/rankings";
import {
  fetchProductRankTrends,
  mapRankTrendsToChartData,
} from "../api/rankings";

export const CATEGORY_MAP = {
  all_beauty: 1,
  lip_care: 2,
  skin_care: 3,
  lip_makeup: 4,
  face_powder: 5,
} as const;
export type CategoryCode = keyof typeof CATEGORY_MAP;

export const RANK_RANGE = {
  WEEK: "WEEK",
  MONTH: "MONTH",
  YEAR: "YEAR",
} as const;

export type RankRange = (typeof RANK_RANGE)[keyof typeof RANK_RANGE];

function formatXAxisDate(dateStr: string, period: PeriodType) {
  const date = new Date(dateStr);

  const year = String(date.getFullYear()).slice(2); // 25
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (period === "yearly") {
    return `${year}/${month}`; // 25/01
  }

  return `${month}/${day}`; // 12/31
}

function RankingTooltip({
  active,
  payload,
  label,
  period,
}: TooltipProps<number, string> & { period: PeriodType }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="ranking-tooltip">
      <div className="ranking-tooltip__date">
        {formatXAxisDate(String(label), period)}
      </div>

      {payload[0].dataKey === "overallRank" && (
        <div>
          <div className="ranking-tooltip__category">{data.overallCategory}</div>
          <div className="ranking-tooltip__rank">{data.overallRank}위</div>
        </div>
      )}

      {payload[0].dataKey === "categoryRank" && (
        <div>
          <div className="ranking-tooltip__category">{data.categoryCategory}</div>
          <div className="ranking-tooltip__rank">{data.categoryRank}위</div>
        </div>
      )}
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

const periodConfigs = {
  weekly: { label: "이번 주", points: 7 },
  monthly: { label: "이번 달", points: 30 },
  yearly: { label: "올해", points: 12 },
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
  const [products, setProducts] = useState<LaneigeProductUI[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

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
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");

  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].productId);
    }
  }, [products, selectedProduct]);

  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [scrollX, setScrollX] = useState(0);

  const filteredProducts =
    productSearchTerm.trim() === ""
      ? products
      : products.filter((p) =>
          p.name.toLowerCase().includes(productSearchTerm.trim().toLowerCase())
        );

  const selectedProductData = products.find(
    (p) => p.productId === selectedProduct
  );
  const selectedProductId = selectedProduct;
  const selectedProductName = selectedProductData?.name || "";
  const selectedProductStyle = selectedProductData?.style || "";
  const PERIOD_TO_RANGE_MAP: Record<PeriodType, RankRange> = {
    weekly: RANK_RANGE.WEEK,
    monthly: RANK_RANGE.MONTH,
    yearly: RANK_RANGE.YEAR,
  };

  const filteredRankings =
    searchTerm.trim() === ""
      ? rankings
      : rankings.filter((item) => {
          const q = searchTerm.trim().toLowerCase();
          const name = item.product_name.toLowerCase();
          const brand = item.product_name.split(" ")[0]?.toLowerCase() ?? "";
          return name.includes(q) || brand.includes(q);
        });

  type RankViewType = "rank1" | "rank2";

  const [activeRank, setActiveRank] = useState<RankViewType>("rank1");

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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await fetchCurrentProducts();
        console.log("Fetched products:", res);
        setProducts(res.items);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProductId) return;

    async function loadRankTrends() {
      try {
        setChartLoading(true);

        const range = PERIOD_TO_RANGE_MAP[period];

        const res = await fetchProductRankTrends(selectedProductId, range);
        console.log("내가 넘긴 데이터:", selectedProductId, range);
        console.log("랭크 추이 선택:", res);
        const mapped = mapRankTrendsToChartData(res);
        setChartData(mapped);
      } catch (e) {
        console.error("랭크 추이 로드 실패", e);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    }

    loadRankTrends();
  }, [selectedProductId, period]);

  const handleScroll = (dir: "left" | "right") => {
    const el = document.getElementById("ranking-product-scroll");
    if (!el) return;

    const delta = dir === "left" ? -300 : 300;
    const next = Math.max(0, scrollX + delta);
    el.scrollTo({ left: next, behavior: "smooth" });
    setScrollX(next);
  };

  const rankingTableKey = `amazon-ranking-table-${selectedCategory}`;
  const latestPoint = chartData[chartData.length - 1];

  const ActiveDot = (props: any) => {
    const { cx, cy, value } = props;
    if (value == null) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#6691ff"
        stroke="#ffffff"
        strokeWidth={2}
        filter="url(#dotShadow)"
      />
    );
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
                  uniqueKey: rankingTableKey,
                })
              }
              onRemove={() => removeByUniqueKey(rankingTableKey)}
              isInCart={isInCart(rankingTableKey)}
            />
          </div>
        </header>

        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <colgroup>
              <col style={{ width: "110px" }} /> {/* 순위 */}
              <col style={{ width: "150px" }} /> {/* 브랜드 */}
              <col style={{ width: "auto" }} /> {/* 제품명 */}
              <col style={{ width: "130px" }} /> {/* 이전 순위 */}
              <col style={{ width: "130px" }} /> {/* 변동 */}
            </colgroup>
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
                filteredRankings.slice(0, 30).map((item) => (
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

                    <div
                      className={`ranking-product-name ${
                        item.is_laneige ? "is-laneige" : ""
                      }`}
                    >
                      {item.product_name}
                    </div>

                    <td className="prev-rank">{item.prev_rank}위</td>

                    <td className="rank-change">
                      {item.rank_change > 0 && (
                        <span className="rank-up">▲ +{item.rank_change}</span>
                      )}
                      {item.rank_change < 0 && (
                        <span className="rank-down">
                          ▼ -{Math.abs(item.rank_change)}
                        </span>
                      )}
                      {item.rank_change === 0 && (
                        <span className="rank-neutral">-</span>
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
      <section className="ranking-card ranking-card--chart">
        {/* ===== Header ===== */}
        <header className="ranking-card__header ranking-card__header--chart">
          <h2 className="ranking-card__title">LANEIGE 제품 순위 변동 추이</h2>

          <AddToCartButton
            onAdd={() =>
              addToCart({
                type: "chart",
                title: `${periodConfigs[period].label} ${selectedProductName} 순위 추이`,
                data: chartData,
                page: "ranking",
                uniqueKey: `ranking-chart-${selectedProduct}-${period}`,
              })
            }
            onRemove={() =>
              removeByUniqueKey(`ranking-chart-${selectedProduct}-${period}`)
            }
            isInCart={isInCart(`ranking-chart-${selectedProduct}-${period}`)}
          />
        </header>

        {/* ===== Product Search ===== */}
        <div className="ranking-chart__search">
          <Search className="ranking-chart__search-icon" />
          <input
            placeholder="제품명 검색"
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
          />
        </div>

        {/* ===== Period Filter ===== */}
        <div className="ranking-chart__period">
          {(Object.keys(periodConfigs) as PeriodType[]).map((p) => (
            <button
              key={p}
              className={`ranking-chart__period-btn ${
                period === p ? "is-active" : ""
              }`}
              onClick={() => setPeriod(p)}
            >
              {periodConfigs[p].label}
            </button>
          ))}
        </div>

        {/* ===== Product Selector ===== */}
        <div className="product-selector">
          <button
            className="scroll-btn scroll-btn--left"
            onClick={() => handleScroll("left")}
          >
            <ChevronLeft />
          </button>

          <div id="ranking-product-scroll" className="product-scroll">
            {filteredProducts.map((p) => (
              <button
                key={p.productId}
                className={`product-card ${
                  selectedProduct === p.productId ? "product-card--active" : ""
                }`}
                onClick={() => setSelectedProduct(p.productId)}
              >
                <span className="product-card__rank">#{p.productId}</span>

                <ImageWithFallback
                  src={p.imageUrl}
                  alt={p.name}
                  fallbackSrc="https://via.placeholder.com/150"
                />

                <p className="product-card__name">{p.name}</p>
                <p className="product-card__style">{p.style}</p>
              </button>
            ))}
          </div>

          <button
            className="scroll-btn scroll-btn--right"
            onClick={() => handleScroll("right")}
          >
            <ChevronRight />
          </button>
        </div>

        {/* ===== Selected Product Info ===== */}
        <div className="ranking-chart__product-info">
          <h3 className="ranking-chart__product-name">{selectedProductName}</h3>
          <p className="ranking-chart__product-style">
            - {selectedProductStyle}
          </p>
        </div>
        <p className="ranking-chart__product-period">
          {periodConfigs[period].label} 순위 변동
        </p>

        <div className="category-labels">
          <button
            className={`legend-btn ${
              activeRank === "rank1" ? "is-active" : ""
            }`}
            onClick={() => setActiveRank("rank1")}
          >
            {latestPoint?.overallCategory} {latestPoint?.overallRank}위
          </button>

          <button
            className={`legend-btn ${
              activeRank === "rank2" ? "is-active" : ""
            }`}
            onClick={() => setActiveRank("rank2")}
          >
            {latestPoint?.categoryCategory} {latestPoint?.categoryRank}위
          </button>
        </div>

        {/* ===== Chart ===== */}
        <div className="ranking-chart">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 24, bottom: 16 }}
            >
              <defs>
                <filter
                  id="dotShadow"
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="5"
                    floodColor="#6691FF"
                    floodOpacity="1"
                  />
                </filter>
              </defs>

              <CartesianGrid
                horizontal={true}
                vertical={false}
                stroke="#E5E5E5"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatXAxisDate(value, period)}
                tick={{ fill: "#C4C4C4" }}
                axisLine={{ stroke: "#C4C4C4" }}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                domain={([dataMin, dataMax]) => {
                  // 값이 하나뿐일 때 (ex: 8 → 8)
                  if (dataMin === dataMax) {
                    return [dataMin - 1, dataMax + 1];
                  }

                  // 값 차이가 있을 때 (ex: 1493 → 1490)
                  const padding = Math.max(
                    1,
                    Math.floor((dataMax - dataMin) * 0.2)
                  );

                  return [Math.max(1, dataMin - padding), dataMax + padding];
                }}
                allowDecimals={false}
                tick={{ fill: "#C4C4C4" }}
                axisLine={false}
                tickLine={false}
                reversed={true}
              />
              <Tooltip content={<RankingTooltip period={period}/>} cursor={false} />

              <Line
                type="monotone"
                dataKey={
                  activeRank === "rank1" ? "overallRank" : "categoryRank"
                }
                stroke="#6691ff"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "#6691ff",
                  stroke: "none",
                }}
                activeDot={<ActiveDot />}
                connectNulls
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
