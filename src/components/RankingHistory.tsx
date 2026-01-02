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
  | "overall"
  | "lipcare"
  | "skincare"
  | "lipmakeup"
  | "facepowder";

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

const generateAmazonRankings = () => {
  return [
    {
      rank: 1,
      brand: "Fresh",
      name: "Fresh Rose Face Mask",
      isLaneige: false,
      prevRank: 2,
    },
    {
      rank: 2,
      brand: "LANEIGE",
      name: "Lip Sleeping Mask",
      isLaneige: true,
      prevRank: 2,
    },
    {
      rank: 3,
      brand: "Clinique",
      name: "Clinique Moisture Surge",
      isLaneige: false,
      prevRank: 4,
    },
    {
      rank: 4,
      brand: "CeraVe",
      name: "CeraVe Moisturizing Cream",
      isLaneige: false,
      prevRank: 6,
    },
    {
      rank: 5,
      brand: "Kiehl’s",
      name: "Kiehl’s Ultra Facial Cream",
      isLaneige: false,
      prevRank: 5,
    },
    {
      rank: 6,
      brand: "LANEIGE",
      name: "Water Sleeping Mask",
      isLaneige: true,
      prevRank: 3,
    },
    {
      rank: 7,
      brand: "Neutrogena",
      name: "Neutrogena Hydro Boost",
      isLaneige: false,
      prevRank: 7,
    },
  ];
};

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
    useState<CategoryType>("overall");

  const categoryConfigs: Record<CategoryType, { label: string }> = {
    overall: { label: "전체" },
    lipcare: { label: "립 케어" },
    skincare: { label: "스킨 케어" },
    lipmakeup: { label: "립 메이크업" },
    facepowder: { label: "페이스 파우더" },
  };
  const tableKey = `ranking-table-amazon-${selectedCategory}`;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [amazonRankings] = useState(generateAmazonRankings());

  const [selectedProduct, setSelectedProduct] = useState(
    laneigeProducts[0].name
  );
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [scrollX, setScrollX] = useState(0);

  const filteredRankings = amazonRankings.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {filteredRankings.slice(0, 30).map((p) => {
                const change = p.prevRank - p.rank;
                return (
                  <tr
                    key={p.rank}
                    className={`ranking-table__row ${
                      p.isLaneige ? "ranking-table__row--laneige" : ""
                    }`}
                  >
                    <td>
                      <span
                        className={`ranking-badge ${
                          p.isLaneige ? "ranking-badge--laneige" : ""
                        }`}
                      >
                        {p.rank}
                      </span>
                    </td>
                    <td>{p.brand}</td>
                    <td>{p.name}</td>
                    <td className="prev-rank">{p.prevRank}위</td>
                    <td className="rank-change">
                      {change > 0 && (
                        <span className="rank-up">▲ +{change}</span>
                      )}
                      {change < 0 && (
                        <span className="rank-down">▼ -{Math.abs(change)}</span>
                      )}
                      {change === 0 && (
                        <span className="rank-neutral">변동 없음</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                title: `${periodConfigs[period].label} ${selectedProduct} 순위 추이`,
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
                key={p.name}
                className={`product-card ${
                  selectedProduct === p.name ? "product-card--active" : ""
                }`}
                onClick={() => setSelectedProduct(p.name)}
              >
                {/* <span className="product-card__rank">
                  #{p.categories.overall}
                </span> */}

                <ImageWithFallback
                  src={p.imageUrl}
                  alt={p.name}
                  fallbackSrc="https://via.placeholder.com/150"
                />

                <p className="product-card__name">{p.name}</p>
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
          <h3>{selectedProduct}</h3>
          <p>
            {periodConfigs[period].label} {selectedProduct} 순위 변동
          </p>
        </div>

        {/* ===== Chart ===== */}
        <div className="ranking-chart">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData}>
              <CartesianGrid
                horizontal={true}
                vertical={false}
                stroke="#E5E5E5"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#C4C4C4" }}
                axisLine={{ stroke: "#C4C4C4" }}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                tick={{ fill: "#C4C4C4" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<RankingTooltip />}
                cursor={{ stroke: "#c7d4ff", strokeWidth: 1 }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ top: -10 }}
              />

              {categoryKeys.map((cat, i) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={`${cat}_rank`}
                  name={categoryConfigs[cat].label}
                  stroke={i === 0 ? "#6691ff" : "#C1D2FF"}
                  fill={i === 0 ? "#6691ff" : "#C1D2FF"}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
