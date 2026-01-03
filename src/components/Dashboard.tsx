import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Star,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AddToCartButton } from "./AddToCartButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { InsightItem } from "../App";
import "../styles/Dashboard.css";
import "../styles/Dashtable.css";
import insightIcon from "../assets/sparkler.svg";
import { BestSellerTop5 } from "./DashBestSellerTop5";
import { ProductDetailTable } from "./DashProductDetailTable";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

// API
import {
  fetchTop5Bestsellers,
  mapTop5Rows,
  mapProductDetail,
  fetchTop1BestSeller,
  fetchRisingProduct,
} from "../api/dashboard";
import type {
  BestSellerItemRaw,
  Top1BestSellerItemRaw,
} from "../types/api/dashboard";
import type { BestSellerTop5Row, ProductDetailRow } from "../types/dashboard";

interface DashboardProps {
  addToCart: (item: Omit<InsightItem, "id" | "timestamp">) => void;
  removeByUniqueKey: (uniqueKey: string) => void;
  isInCart: (uniqueKey: string) => boolean;
}

const salesData = [
  { date: "12/22", sales: 3800 },
  { date: "12/23", sales: 4200 },
  { date: "12/24", sales: 3900 },
  { date: "12/25", sales: 5100 },
  { date: "12/26", sales: 4600 },
  { date: "12/27", sales: 5800 },
  { date: "12/28", sales: 6200 },
  { date: "12/29", sales: 5900 },
  { date: "12/30", sales: 6500 },
  { date: "12/31", sales: 8500 },
];

function CustomTooltip({ activePoint }: any) {
  if (!activePoint) return null;

  return (
    <div
      className="chart-tooltip"
      style={{
        transform: "translate(-100%, -100%)",
        pointerEvents: "none",
      }}
    >
      <div className="chart-tooltip__date">{activePoint.label}</div>
      <div className="chart-tooltip__value">
        판매량 : {activePoint.value.toLocaleString()}
      </div>
    </div>
  );
}

// 현재 연-월 문자열 반환
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function Dashboard({
  addToCart,
  removeByUniqueKey,
  isInCart,
}: DashboardProps) {
  const [activePoint, setActivePoint] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);

  const [top5Rows, setTop5Rows] = useState<BestSellerTop5Row[]>([]);
  const [top1Product, setTop1Product] = useState<Top1BestSellerItemRaw | null>(
    null
  );
  const [detailRows, setDetailRows] = useState<ProductDetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const month = getCurrentMonth();

  const [risingProduct, setRisingProduct] = useState<any>(null);

  const [todayInsight, setTodayInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(true);

  // [1] 베스트셀러 top5 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchTop5Bestsellers(month);
        setTop5Rows(mapTop5Rows(res.items));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [month]);

  // [2] 제품별 상세 현황 데이터 로드
  useEffect(() => {
  async function load() {
    try {
      const res = await fetchTop5Bestsellers(month);

      setTop5Rows(mapTop5Rows(res.items));
      setDetailRows(mapProductDetail(res.items));
    } finally {
      setLoading(false);
    }
  }

  load();
}, [month]);

  // [3] 매출 1위 제품 데이터 로드
  useEffect(() => {
    async function loadTop1() {
      try {
        const res = await fetchTop1BestSeller(month);
        setTop1Product(res);
      } catch (e) {
        console.error("top1 fetch error", e);
      }
    }

    loadTop1();
  }, [month]);

  // [4] 급상승 제품 데이터 로드
  useEffect(() => {
    async function loadRising() {
      try {
        const product = await fetchRisingProduct();
        setRisingProduct(product);
      } catch (e) {
        console.error("rising fetch error", e);
      }
    }

    loadRising();
  }, []);

  useEffect(() => {
    const fetchTodayInsight = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/today/insight`);

        if (!res.ok) {
          throw new Error("Failed to fetch today insight");
        }

        const data = await res.json();
        setTodayInsight(data.insight);
      } catch (e) {
        console.error("오늘의 인사이트 로드 실패", e);
        setTodayInsight("오늘의 인사이트를 불러오지 못했어요.");
      } finally {
        setInsightLoading(false);
      }
    };

    fetchTodayInsight();
  }, []);

  return (
    <div className="dashboard">
      {/* Today Insight */}
      <section className="dashboard__insight">
        <div className="dashboard__insight-icon">
          <img
            src={insightIcon}
            alt="오늘의 인사이트"
            className="dashboard__insight-icon-img"
          />
        </div>
        <div>
          <h3 className="dashboard__insight-label">오늘의 인사이트</h3>
          <p className="dashboard__insight-text">
            {insightLoading ? "오늘의 인사이트를 분석 중이에요…" : todayInsight}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="dashboard__stats-grid">
        <StatCard
          title="지난 달 총 판매량"
          value="21,400개"
          change="+12.5%"
          icon={Package}
          trend="up"
          uniqueKey="dashboard-stat-sales"
          addToCart={addToCart}
          removeByUniqueKey={removeByUniqueKey}
          isInCart={isInCart}
        />
        <StatCard
          title="지난 달 매출액"
          value="$145,242"
          change="+8.3%"
          icon={DollarSign}
          trend="up"
          uniqueKey="dashboard-stat-revenue"
          addToCart={addToCart}
          removeByUniqueKey={removeByUniqueKey}
          isInCart={isInCart}
        />

        {top1Product && (
          <StatCard
            variant="product"
            label="지난 달 매출 1위"
            title={top1Product.title}
            imageUrl={top1Product.imageUrl}
            rating={top1Product.rating}
            reviewCount={top1Product.reviewCount}
            growth={top1Product.growth}
            uniqueKey="dashboard-product-of-month"
            addToCart={addToCart}
            removeByUniqueKey={removeByUniqueKey}
            isInCart={isInCart}
          />
        )}

        {risingProduct && (
          <StatCard
            variant="product"
            label="급상승한 제품"
            title={risingProduct.title}
            imageUrl={risingProduct.imageUrl}
            rating={risingProduct.rating}
            reviewCount={risingProduct.reviewCount}
            growth={risingProduct.growth}
            uniqueKey="dashboard-rising-product"
            addToCart={addToCart}
            removeByUniqueKey={removeByUniqueKey}
            isInCart={isInCart}
          />
        )}
      </section>

      {/* Sales Chart */}
      <div className="chart-card">
        <div className="chart-card__header">
          <h2 className="chart-card__title">지난 달 판매 추이</h2>

          <div className="chart-card__action">
            <AddToCartButton
              onAdd={() =>
                addToCart({
                  type: "chart",
                  title: "지난 달 판매 추이",
                  data: salesData,
                  page: "dashboard",
                  uniqueKey: "dashboard-chart-monthly-sales",
                })
              }
              onRemove={() =>
                removeByUniqueKey("dashboard-chart-monthly-sales")
              }
              isInCart={isInCart("dashboard-chart-monthly-sales")}
            />
          </div>
        </div>

        <div className="chart-card__chart">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={salesData}
              onMouseMove={(state: any) => {
                if (
                  state.isTooltipActive &&
                  state.activePayload &&
                  state.activeCoordinate
                ) {
                  setActivePoint({
                    x: state.activeCoordinate.x,
                    y: state.activeCoordinate.y,
                    label: state.activeLabel,
                    value: state.activePayload[0].value,
                  });
                }
              }}
              onMouseLeave={() => setActivePoint(null)}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6691FF" stopOpacity={0.75} />
                  <stop
                    offset="100%"
                    stopColor="#ffffffff"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>

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
                content={<CustomTooltip activePoint={activePoint} />}
                position={
                  activePoint
                    ? { x: activePoint.x - 12, y: activePoint.y - 12 }
                    : undefined
                }
                cursor={{
                  stroke: "#C4C4C4",
                  strokeDasharray: "5 5",
                  strokeWidth: 1,
                }}
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#6b86ff"
                strokeWidth={2}
                fill="url(#salesGradient)"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BestSellerTop5
        data={top5Rows}
        loading={loading}
        addToCart={addToCart}
        removeByUniqueKey={removeByUniqueKey}
        isInCart={isInCart}
      />

      <ProductDetailTable
        data={detailRows}
        loading={loading}
        addToCart={addToCart}
        removeByUniqueKey={removeByUniqueKey}
        isInCart={isInCart}
      />
    </div>
  );
}

type StatCardVariant = "kpi" | "product";

interface StatCardProps {
  /* 공통 */
  variant?: StatCardVariant; // 기본: kpi
  title: string;
  uniqueKey: string;
  addToCart: DashboardProps["addToCart"];
  removeByUniqueKey: DashboardProps["removeByUniqueKey"];
  isInCart: DashboardProps["isInCart"];

  /* KPI 카드*/
  value?: string;
  change?: string;
  icon?: any;
  trend?: "up" | "down";

  /* Product 카드 */
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  growth?: string;
  label?: string;
}

function StatCard({
  variant = "kpi",
  title,
  value,
  change,
  icon: Icon,
  trend,
  uniqueKey,
  addToCart,
  removeByUniqueKey,
  isInCart,
  imageUrl,
  rating,
  reviewCount,
  growth,
  label,
}: StatCardProps) {
  /* ================= KPI 카드 ================= */
  if (variant === "kpi") {
    return (
      <div className="stat-card stat-card--kpi">
        {/* 왼쪽 콘텐츠 */}
        <div className="stat-card__content">
          <h3 className="stat-card__title">{title}</h3>
          <p className="stat-card__value">{value}</p>
        </div>

        {/* 하단 고정 영역 */}
        <div className="stat-card__footer">
          <div
            className={`stat-card__badge ${
              trend === "up" ? "is-up" : "is-down"
            }`}
          >
            {trend === "up" ? "↑" : "↓"} {change}
          </div>

          {/* 오른쪽 + 버튼 */}
          <div className="stat-card__action">
            <AddToCartButton
              onAdd={() =>
                addToCart({
                  type: "stat",
                  title,
                  data: { value, change, trend },
                  page: "dashboard",
                  uniqueKey,
                })
              }
              onRemove={() => removeByUniqueKey(uniqueKey)}
              isInCart={isInCart(uniqueKey)}
            />
          </div>
        </div>
      </div>
    );
  }
  /* ================= Product 카드 ================= */
  return (
    <div className="stat-card stat-card--product">
      {/* 상단 라벨 */}
      <div className="stat-card__header">
        <span className="stat-card__tag">{label}</span>
      </div>

      {/* 본문 */}
      <div className="stat-card__content stat-card__content--product">
        {/* 왼쪽: 이미지 */}
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          fallbackSrc="https://via.placeholder.com/80"
        />

        {/* 오른쪽: 텍스트 정보 */}
        <div className="stat-card__product-info">
          <h3 className="stat-card__title">{title}</h3>

          <div className="stat-card__rating">
            <Star size={16} fill="#FFA82F" color="#FFA82F" />
            {rating} <span>({reviewCount?.toLocaleString()})</span>
          </div>
        </div>
      </div>

      {/* 성장률 */}
      <div className="stat-card__badge-wrapper">
        <div
          className={`stat-card__badge ${trend === "up" ? "is-down" : "is-up"}`}
        >
          {trend === "up" ? "↓" : "↑"} {growth}
        </div>
      </div>

      {/* 플러스 버튼 */}
      <div className="stat-card__action">
        <AddToCartButton
          onAdd={() =>
            addToCart({
              type: "stat",
              title,
              data: { rating, reviewCount, growth },
              page: "dashboard",
              uniqueKey,
            })
          }
          onRemove={() => removeByUniqueKey(uniqueKey)}
          isInCart={isInCart(uniqueKey)}
        />
      </div>
    </div>
  );
}
