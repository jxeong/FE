import { useState, useEffect } from "react";
import "../styles/ReviewAnalysis.css";
import { AddToCartButton } from "./AddToCartButton";
import { Search, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, BadgeAlert } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fetchCurrentProducts, LaneigeProductUI } from "../api/rankings";
import { fetchProductReviewAnalysis } from "../api/reviews";

interface ReviewAnalysisProps {
  addToCart: (item: any) => void;
  removeByUniqueKey: (uniqueKey: string) => void;
  isInCart: (uniqueKey: string) => boolean;
}

interface Insight {
  id: string;
  title: string;
  mentions: number;
  score: number;
  type: "positive" | "negative" | "neutral";
  aiAnalysis: string;
}

export function ReviewAnalysis({
  addToCart,
  removeByUniqueKey,
  isInCart,
}: ReviewAnalysisProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const [products, setProducts] = useState<LaneigeProductUI[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [scrollX, setScrollX] = useState(0);
  const [reviewAnalysis, setReviewAnalysis] = useState<any | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const sentimentData = reviewAnalysis
    ? {
        positive: reviewAnalysis.sentiment.positive_pct,
        negative: reviewAnalysis.sentiment.negative_pct,
      }
    : { positive: 0, negative: 0 };

  const ratingDistribution = reviewAnalysis
    ? reviewAnalysis.rating_distribution.map((r: any) => ({
        stars: r.star,
        percentage: r.pct,
      }))
    : [];

  const insights: Insight[] = reviewAnalysis
    ? reviewAnalysis.keyword_insights.map((k: any, idx: number) => ({
        id: String(idx),
        title: k.aspect_name,
        mentions: k.mention_total,
        score: k.score,
        type: k.score >= 70 ? "positive" : k.score <= 40 ? "negative" : "neutral",
        aiAnalysis: k.summary,
      }))
    : [];

  const getIconColor = (type: string) => {
    switch (type) {
      case "positive":
        return "#13C85E";
      case "negative":
        return "#FF2F36";
      case "neutral":
        return "#FFA82F";
      default:
        return "#13C85E";
    }
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        const res = await fetchCurrentProducts();
        setProducts(res.items);
      } catch (e) {
        console.error("Failed to load products", e);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0 && selectedProduct == null) {
      setSelectedProduct(products[0].productId);
    }
  }, [products, selectedProduct]);

  const filteredProducts =
    productSearchTerm.trim() === ""
      ? products
      : products.filter((p) =>
          p.name.toLowerCase().includes(productSearchTerm.trim().toLowerCase())
        );

  const handleScroll = (dir: "left" | "right") => {
    const el = document.getElementById("review-product-scroll");
    if (!el) return;

    const delta = dir === "left" ? -300 : 300;
    const next = Math.max(0, scrollX + delta);
    el.scrollTo({ left: next, behavior: "smooth" });
    setScrollX(next);
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "positive":
        return "#CCFFE1";
      case "negative":
        return "#FFCBCD";
      case "neutral":
        return "#FFE8C8";
      default:
        return "#CCFFE1";
    }
  };

  useEffect(() => {
    if (!selectedProduct) return;

    async function loadReviewAnalysis() {
      try {
        setReviewLoading(true);
        const res = await fetchProductReviewAnalysis(selectedProduct);
        setReviewAnalysis(res);
      } catch (e) {
        console.error("Failed to load review analysis", e);
        setReviewAnalysis(null);
      } finally {
        setReviewLoading(false);
      }
    }

    loadReviewAnalysis();
  }, [selectedProduct]);

  return (
    <div className="review-analysis">
      <main className="review-analysis__main">
        {/* 1. 분석할 제품 선택 섹션 */}
        <section className="product-selection">
          <div className="product-selection__header">
            <h2 className="product-selection__title">분석할 제품 선택</h2>
            <div className="product-selection__actions">
              <AddToCartButton
                onAdd={() =>
                  addToCart({
                    type: "product-selection",
                    title: "분석할 제품 선택",
                    data: products,
                    page: "review",
                    uniqueKey: "review-product-selection",
                  })
                }
                onRemove={() => removeByUniqueKey("review-product-selection")}
                isInCart={isInCart("review-product-selection")}
              />
            </div>
          </div>

          <div className="product-selection__search">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="제품명 검색"
              className="product-selection__search-input"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
            />
          </div>

          <div className="product-carousel">
            <button
              className="scroll-btn scroll-btn--left"
              onClick={() => handleScroll("left")}
            >
              <ChevronLeft />
            </button>
            <div id="review-product-scroll" className="product-carousel__items">
              {loadingProducts ? (
                <div className="product-loading">로딩 중...</div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.productId}
                    className={`product-card ${
                      selectedProduct === product.productId ? "product-card--active" : ""
                    }`}
                    onClick={() => setSelectedProduct(product.productId)}
                  >
                    <div className={`product-card__badge ${selectedProduct === product.productId ? "product-card__badge--active" : ""}`}>#{product.productId}</div>
                    <div className="product-card__image">
                      <ImageWithFallback
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackSrc="https://via.placeholder.com/150"
                      />
                    </div>
                    <p className="product-card__name">{product.name}</p>
                    <p className="product-card__style">{product.style}</p>
                  </button>
                ))
              )}
            </div>
            <button
              className="scroll-btn scroll-btn--right"
              onClick={() => handleScroll("right")}
            >
              <ChevronRight />
            </button>
          </div>
        </section>

        {/* 2. 고객들이 말합니다 섹션 */}
        <div className="customer-feedback">
          <div className="section-header-row">
            <h3 className="customer-feedback__title">
              <span className="highlight">고객들이 말합니다</span>
              <span className="count">{reviewAnalysis ? `전체 ${reviewAnalysis.reputation.review_count.toLocaleString()}개 리뷰 분석` : "전체 -개 리뷰"}</span>
            </h3>
            <AddToCartButton
              onAdd={() =>
                  addToCart({
                    type: "feedback-summary",
                    title: "고객들이 말합니다 (리뷰 요약)",
                    data: reviewAnalysis ? { count: reviewAnalysis.reputation.review_count, rating: reviewAnalysis.reputation.rating } : null,
                    page: "review",
                    uniqueKey: "review-customer-feedback",
                  })
              }
              onRemove={() => removeByUniqueKey("review-customer-feedback")}
              isInCart={isInCart("review-customer-feedback")}
            />
          </div>
          <div className="customer-feedback__rating">
            <span className="rating-label">긍정 반응</span>
            <span className="rating-value">{reviewAnalysis ? `${sentimentData.positive}%` : "-"}</span>
            <div className="rating-stars">
              <span className="star star--filled">★</span>
              <span className="star star--filled">★</span>
              <span className="star star--filled">★</span>
              <span className="star star--filled">★</span>
              <span className="star star--half">★</span>
            </div>
          </div>
          <blockquote className="customer-feedback__quote">
            {reviewLoading ? "로딩 중..." : reviewAnalysis ? `"${reviewAnalysis.customers_say.current_text}"` : "-"}
          </blockquote>
        </div>

        <div className="sentiment-analysis">
          <div className="sentiment-grid">
            {/* 3. 감정 분석 분포 섹션 */}
            <div className="sentiment-card">
              <div className="card-header">
                <h3 className="card-title">감정 분석 분포</h3>
                <div className="card-header__actions">
                  <AddToCartButton
                    onAdd={() =>
                      addToCart({
                        type: "chart",
                        title: "감정 분석 분포",
                        data: reviewAnalysis ? reviewAnalysis.sentiment : null,
                        page: "review",
                        uniqueKey: "review-sentiment-distribution",
                      })
                    }
                    onRemove={() =>
                      removeByUniqueKey("review-sentiment-distribution")
                    }
                    isInCart={isInCart("review-sentiment-distribution")}
                  />
                </div>
              </div>
              <div className="sentiment-chart">
                <div className="chart-container">
                  <svg className="donut-chart" viewBox="0 0 200 200">
                    {/* 배경 원*/}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="28"
                    />

                    {/* Positive 세그먼트 */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#6691FF"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${(sentimentData.positive / 100) * 502 - 30} 502`}
                      strokeDashoffset="-20"
                      transform="rotate(-90 100 100)"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredSegment("positive")}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />

                    {/* Negative 세그먼트 */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#D6E2FF"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${(sentimentData.negative / 100) * 502 - 30} 502`}
                      strokeDashoffset={`-${(sentimentData.positive / 100) * 502 + 20}`}
                      transform="rotate(-90 100 100)"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredSegment("negative")}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  </svg>
                  {/* 마우스 호버 시 나타나는 플로팅 툴팁 (CSS로 제어) */}
                  {hoveredSegment && (
                    <div className={`chart-tooltip-simple ${hoveredSegment}`}>
                      <span className="tooltip-label">
                        {hoveredSegment === "positive"
                          ? "긍정 반응"
                          : "부정 반응"}
                      </span>
                      <span className="tooltip-value">
                        {hoveredSegment === "positive"
                          ? sentimentData.positive
                          : sentimentData.negative}
                        %
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. 평점 지수 (평판 지수) 섹션 */}
            <div className="sentiment-card">
              <div className="card-header">
                <h3 className="card-title">평점 지수</h3>
                <div className="card-header__actions">
                  <AddToCartButton
                    onAdd={() =>
                      addToCart({
                        type: "stat",
                        title: "평점 지수",
                        data: reviewAnalysis ? { score: reviewAnalysis.reputation.score, rating: reviewAnalysis.reputation.rating } : null,
                        page: "review",
                        uniqueKey: "review-rating-index",
                      })
                    }
                    onRemove={() => removeByUniqueKey("review-rating-index")}
                    isInCart={isInCart("review-rating-index")}
                  />
                </div>
              </div>
              <div className="rating-chart">
                <div className="rating-score-circle">
                  <svg viewBox="0 0 200 200" className="score-circle">
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#e5e5e5"
                      strokeWidth="20"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#6691ff"
                      strokeWidth="20"
                      strokeDasharray="470 534"
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="score-content">
                    <div className="score-number">{reviewAnalysis ? reviewAnalysis.reputation.score : "-"}</div>
                    <div className="score-label">신뢰도 점수</div>
                  </div>
                </div>
                <div className="rating-stars-display">
                  <span className="star star--filled">★</span>
                  <span className="star star--filled">★</span>
                  <span className="star star--filled">★</span>
                  <span className="star star--filled">★</span>
                  <span className="star star--half">★</span>
                  <span className="rating-number">{reviewAnalysis ? reviewAnalysis.reputation.rating.toFixed(1) : "-"}</span>
                </div>
                <div className="review-count">{reviewAnalysis ? `${reviewAnalysis.reputation.review_count.toLocaleString()}개 리뷰` : "-"}</div>
              </div>
            </div>
          </div>

          {/* 5. 평점 분포 섹션 */}
          <div className="rating-distribution">
            <div className="rating-section-header-row">
              <h3 className="section-title">평점 분포</h3>
              <AddToCartButton
                onAdd={() =>
                  addToCart({
                    type: "chart",
                    title: "평점 분포",
                    data: reviewAnalysis ? reviewAnalysis.rating_distribution : null,
                    page: "review",
                    uniqueKey: "review-rating-distribution",
                  })
                }
                onRemove={() => removeByUniqueKey("review-rating-distribution")}
                isInCart={isInCart("review-rating-distribution")}
              />
            </div>
            <div className="rating-bars">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="rating-bar-row">
                  <div className="rating-bar-label">
                    <span className="star-number">{item.stars}</span>
                    <span className="star-filled">★</span>
                  </div>
                  <div className="rating-bar-container">
                    <div className="rating-bar-bg">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="rating-bar-percentage">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. AI 키워드 분석 및 비즈니스 인사이트 섹션 */}
        <section className="review-ai-insights">
          <div className="ai-insights__container">
            <div className="ai-section-header-row">
              <h2 className="ai-insights__title">
                AI 키워드 분석 및 비즈니스 인사이트
              </h2>
              <AddToCartButton
                onAdd={() =>
                  addToCart({
                    type: "insight-list",
                    title: "AI 키워드 분석 및 비즈니스 인사이트",
                    data: reviewAnalysis ? reviewAnalysis.keyword_insights : null,
                    page: "review",
                    uniqueKey: "review-ai-insights",
                  })
                }
                onRemove={() => removeByUniqueKey("review-ai-insights")}
                isInCart={isInCart("review-ai-insights")}
              />
            </div>

            <div className="insights-list">
              {insights.map((insight) => (
                <div key={insight.id} className="insight-item">
                  <div className="insight-header">
                    <div
                      className="insight-icon"
                      style={{ backgroundColor: getIconBg(insight.type) }}
                    >
                      {insight.type === "positive" ? (
                        <ThumbsUp color={getIconColor(insight.type)} size={20} />
                      ) : insight.type === "negative" ? (
                        <ThumbsDown color={getIconColor(insight.type)} size={20} />
                      ) : insight.type === "neutral" ? (
                        <BadgeAlert color={getIconColor(insight.type)} size={20} />
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 5V19M12 5C12 5 8 8 8 12M12 5C12 5 16 8 16 12"
                            stroke={getIconColor(insight.type)}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="insight-header-text">
                      <h3 className="insight-title">{insight.title}</h3>
                    </div>
                  </div>
                  <div className="insight-meta">
                    <span className="mention-count">
                      {insight.mentions.toLocaleString()} 언급
                    </span>
                    <span className="score">
                      점수 <span className="score-value">{insight.score}</span>
                      /100
                    </span>
                  </div>

                  <div className="insight-analysis">
                    <div className="ai-badge">
                      <span>✦ AI 해석</span>
                    </div>
                    <p className="analysis-text">{insight.aiAnalysis}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
