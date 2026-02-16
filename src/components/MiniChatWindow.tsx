import { useState, useRef, useEffect } from "react";
import { Send, Bot, Plus, FileText, Maximize2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import "../styles/MiniChatWindow.css";
import type { InsightItem, PageType } from "../App";
import { PAGE_LABEL_MAP, ITEM_TYPE_LABEL_MAP } from "../utils/label";
import {
  fetchTop1BestSellerAIContext,
  fetchRisingProductItemAIContext,
  fetchTop5Bestsellers,
  mapTop5ToAILines,
} from "../api/dashboard";
import {
  fetchCurrentRanking,
  mapCurrentRankingToAILines,
  fetchProductRankTrends,
  mapRankingHistoryToAILines,
  normalizeRankTrendApiToAI,
  AMAZON_CATEGORY_ID_MAP,
} from "../api/rankings";
import { fetchProductReviewAnalysis } from "../api/reviews";
import type { RatingDistItem, KeywordInsight } from "../api/reviews";

/* ================= Types ================= */
type ChatPayload = {
  messages: ChatMessageForAPI[];
};

type GenerateReportResponse = {
  report_id: string;
  body_md: string;
  title?: string;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachedData?: string[];
  canGenerateReport?: boolean;
  reportPayload?: ChatPayload;
}

type AISelectableData = {
  id: string;
  title: string;
  page: string;
  type: "stat" | "chart" | "table" | "insight";
  fetchContext: () => Promise<any>;
};

type AttachedDataBlock = {
  title: string;
  lines: string[];
};

type ChatMessageForAPI = {
  role: "user" | "assistant";
  content: string;
  attachedData?: AttachedDataBlock[];
};

/* ================= Static Data ================= */
const suggestedQuestions = [
  "이번 달 매출 트렌드를 분석해주세요.",
  "Water Sleeping Mask의 아마존 순위 변동을 알려주세요.",
];

const AMAZON_CATEGORIES = {
  all_beauty: "전체",
  lip_care: "립 케어",
  skin_care: "스킨 케어",
  lip_makeup: "립 메이크업",
  face_powder: "페이스 파우더",
} as const;
export type AmazonCategory = keyof typeof AMAZON_CATEGORIES;

const categoryBestsellerData: AISelectableData[] = (
  Object.entries(AMAZON_CATEGORIES) as [AmazonCategory, string][]
).map(([category, label]) => ({
  id: `amazon-ranking-table-${category}`,
  title: `아마존 ${label} 베스트셀러 순위`,
  page: "ranking",
  type: "table",
  fetchContext: async () => {
    const categoryId = AMAZON_CATEGORY_ID_MAP[category];
    const res = await fetchCurrentRanking(categoryId);
    return mapCurrentRankingToAILines(category, res);
  },
}));

const allAvailableData: AISelectableData[] = [
  {
    id: "dashboard-stat-sales",
    title: "지난 달 총 판매량",
    page: "dashboard",
    type: "stat",
    fetchContext: async () =>
      "[더미데이터] 지난 달 라네즈 제품 총 판매량: 21,400개",
  },
  {
    id: "dashboard-stat-revenue",
    title: "지난 달 매출액",
    page: "dashboard",
    type: "stat",
    fetchContext: async () =>
      "[더미데이터] 지난 달 라네즈 제품 총 매출액: $145,242",
  },
  {
    id: "dashboard-product-of-month",
    title: "지난 달 매출 1위 제품",
    page: "dashboard",
    type: "stat",
    fetchContext: async () => {
      const month = getCurrentYearMonth();
      const res = await fetchTop1BestSellerAIContext(month);
      return res;
    },
  },
  {
    id: "dashboard-rising-product",
    title: "급상승한 제품",
    page: "dashboard",
    type: "stat",
    fetchContext: async () => {
      const month = getCurrentYearMonth();
      const res = await fetchRisingProductItemAIContext(month);
      return res;
    },
  },
  {
    id: "dashboard-table-top5",
    title: "지난 달 베스트셀러 TOP 5",
    page: "dashboard",
    type: "table",
    fetchContext: async () => {
      const month = getCurrentYearMonth();
      const res = await fetchTop5Bestsellers(month);
      return mapTop5ToAILines(res);
    },
  },
  {
    id: "dashboard-table-product-detail",
    title: "지난 달 베스트셀러 TOP 5 상세 정보",
    page: "dashboard",
    type: "table",
    fetchContext: async () => {
      const month = getCurrentYearMonth();
      const res = await fetchTop5Bestsellers(month);
      return mapTop5ToAILines(res);
    },
  },
  ...categoryBestsellerData,
  {
    id: "dashboard-chart-monthly-sales",
    title: "월별 판매 추이 차트",
    page: "dashboard",
    type: "chart",
    fetchContext: async () =>
      "[더미데이터] 월별 판매 추이: 1월 1,200개 / 2월 1,450개 / 3월 1,800개 / 4월 2,100개",
  },
  {
    id: "keyword-category-distribution",
    title: "카테고리별 키워드 분포",
    page: "keywords",
    type: "chart",
    fetchContext: async () => [
      "Product Benefit: 11,621건",
      "Product Type: 18,763건",
      "Product Feature: 12,463건",
      "Result: 9,174건",
      "Skin Concern: 6,699건",
    ],
  },
  {
    id: "keyword-rankings-table",
    title: "키워드 순위",
    page: "keywords",
    type: "table",
    fetchContext: async () => [
      "1위 hydration (8,956건, +12.3%)",
      "2위 sleeping mask (7,234건, +8.7%)",
      "3위 moisturizing (6,542건, +0.2%)",
      "4위 soft skin (5,876건, +15.4%)",
      "5위 overnight (5,234건, +6.8%)",
    ],
  },
];

/* ================= Helpers ================= */
function downloadMarkdown(params: { filename: string; content: string }) {
  const { filename, content } = params;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function callGenerateReportAPI(
  payload: ChatPayload
): Promise<GenerateReportResponse> {
  const res = await fetch("https://boradora.store/api/report/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Report API Error");
  }

  return (await res.json()) as GenerateReportResponse;
}

async function callChatAPI(payload: { messages: ChatMessageForAPI[] }) {
  const res = await fetch("https://boradora.store/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Chat API Error");
  }

  const data = await res.json();
  return data.answer as string;
}

function normalizeContextToLines(value: any): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value.split("\n").filter(Boolean);
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).map(([key, val]) => `${key}: ${val}`);
  }

  return [];
}

function stripAsterisks(text: string) {
  return text.replace(/\*/g, "");
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeAITitle(title: string): string {
  return title
    .replace(
      /아마존\s+(전체|립 케어|스킨 케어|립 메이크업|페이스 파우더)\s+/,
      "아마존 "
    )
    .trim();
}

function getAITitle(item: AISelectableData): string {
  if (item.page === "ranking" && item.title.includes("순위 추이")) {
    return "제품 순위 변동 추이";
  }

  if (item.page === "ranking" && item.title.includes("베스트셀러 순위")) {
    return normalizeAITitle(item.title);
  }

  return item.title;
}

/* ================= Component ================= */
interface MiniChatWindowProps {
  cartItems: InsightItem[];
  onClose: () => void;
  onNavigateToAI: () => void;
}

export function MiniChatWindow({
  cartItems,
  onClose,
  onNavigateToAI,
}: MiniChatWindowProps) {
  const pocketChartData: AISelectableData[] = cartItems
    .filter((item) => item.type === "chart" && item.page === "ranking")
    .map((item) => ({
      id: item.uniqueKey,
      title: item.title,
      page: "ranking",
      type: "chart",
      fetchContext: async () => {
        const meta = item.meta as any;
        const productId = meta?.productId;
        const range = meta?.range;

        if (!productId || !range) {
          console.error("[AI chart meta missing]", { meta, item });
          return [
            `error: meta missing`,
            `productId: ${String(productId)}`,
            `range: ${String(range)}`,
          ];
        }

        const res = await fetchProductRankTrends(productId, range);
        const normalized = normalizeRankTrendApiToAI(res);
        return mapRankingHistoryToAILines(normalized);
      },
    }));

  const pocketReviewData: AISelectableData[] = cartItems
    .filter((item) => item.page === "review-analysis")
    .map((item) => ({
      id: item.uniqueKey,
      title: item.title,
      page: "review-analysis",
      type: item.type as AISelectableData["type"],
      fetchContext: async () => {
        const meta = item.meta as any;
        const productId = meta?.productId;

        if (!productId) {
          return [`error: productId missing in meta for ${item.uniqueKey}`];
        }

        const res = await fetchProductReviewAnalysis(productId);
        const key = item.uniqueKey;

        if (key.startsWith("review-customer-feedback-")) {
          return [
            `총 리뷰 수: ${res.reputation.review_count.toLocaleString()}개`,
            `평균 평점: ${res.reputation.rating.toFixed(1)}`,
            `고객 피드백: "${res.customers_say.current_text}"`,
          ];
        }
        if (key.startsWith("review-sentiment-distribution-")) {
          return [
            `긍정 반응: ${res.sentiment.positive_pct}%`,
            `부정 반응: ${res.sentiment.negative_pct}%`,
          ];
        }
        if (key.startsWith("review-rating-index-")) {
          return [
            `신뢰도 점수: ${res.reputation.score}`,
            `평균 평점: ${res.reputation.rating.toFixed(1)}`,
            `총 리뷰: ${res.reputation.review_count.toLocaleString()}개`,
          ];
        }
        if (key.startsWith("review-rating-distribution-")) {
          return res.rating_distribution.map(
            (r: RatingDistItem) => `${r.star}점: ${r.pct}%`
          );
        }
        if (key.startsWith("review-ai-insights-")) {
          return res.keyword_insights.map(
            (k: KeywordInsight) =>
              `${k.aspect_name} (언급 ${k.mention_total}건, 점수 ${k.score}/100): ${k.summary}`
          );
        }
        return [`리뷰 분석 데이터: ${item.title}`];
      },
    }));

  const aiSelectableData = [
    ...allAvailableData,
    ...pocketChartData,
    ...pocketReviewData,
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "안녕하세요! LANEIGE 데이터 분석 AI 어시스턴트입니다, 질문해 주세요!",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [generatingReportFor, setGeneratingReportFor] = useState<string | null>(
    null
  );

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    messageRefs.current[last.id]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  const handleGenerateReport = async (msg: Message) => {
    if (!msg.reportPayload) return;

    try {
      setGeneratingReportFor(msg.id);
      const res = await callGenerateReportAPI(msg.reportPayload);
      const title = (res.title?.trim() || "laneige_report").replace(
        /[\\/:*?"<>|]/g,
        "-"
      );
      const filename = `${title}_${res.report_id}.md`;
      downloadMarkdown({
        filename,
        content: res.body_md ?? "",
      });
    } catch (e: any) {
      const errMsg = e?.message ?? "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-report-error`,
          role: "assistant",
          content: `리포트 생성 중 에러: ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setGeneratingReportFor(null);
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim() && selectedData.length === 0) return;

    const attachedDataTitles = selectedData.map((id) => {
      const item = aiSelectableData.find((d) => d.id === id);
      return item?.title || id;
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "선택한 데이터를 분석해주세요",
      timestamp: new Date(),
      attachedData: selectedData.length > 0 ? attachedDataTitles : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const historyForAPI: ChatMessageForAPI[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const attachedDataForAPI: AttachedDataBlock[] = await Promise.all(
        selectedData.map(async (id) => {
          const item = aiSelectableData.find((d) => d.id === id);
          if (!item) return null;

          const raw = await item.fetchContext();

          return {
            title: getAITitle(item),
            lines: normalizeContextToLines(raw),
          };
        })
      ).then((v) => v.filter(Boolean) as AttachedDataBlock[]);

      const userMessageForAPI: ChatMessageForAPI = {
        role: "user",
        content: userMessage.content,
        attachedData:
          attachedDataForAPI.length > 0 ? attachedDataForAPI : undefined,
      };

      const finalPayload: ChatPayload = {
        messages: [...historyForAPI, userMessageForAPI],
      };

      const reply = await callChatAPI(finalPayload);

      const canGenerate = (attachedDataForAPI?.length ?? 0) > 0;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        attachedData: attachedDataTitles.length
          ? attachedDataTitles
          : undefined,
        canGenerateReport: canGenerate,
        reportPayload: canGenerate ? finalPayload : undefined,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (e: any) {
      const errMsg = e?.message ?? "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `에러가 발생했어요: ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setSelectedData([]);
    }
  };

  const toggleData = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const cartDataIds = cartItems.map((item) => item.uniqueKey);
  const pocketData = aiSelectableData.filter((d) => cartDataIds.includes(d.id));
  const otherData = aiSelectableData.filter((d) => !cartDataIds.includes(d.id));

  const selectedDataItems = selectedData
    .map((id) => aiSelectableData.find((d) => d.id === id))
    .filter(Boolean);

  return (
    <motion.div
      className="mini-chat-window"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="mini-chat-header">
        <div className="mini-chat-header-left">
          <Bot size={24} />
          <span>LANEIGE AI 어시스턴트</span>
        </div>
        <div className="mini-chat-header-right">
          <button
            className="mini-chat-header-btn"
            onClick={onNavigateToAI}
            title="전체보기"
          >
            <Maximize2 size={20} />
          </button>
          <button className="mini-chat-header-btn" onClick={onClose} title="닫기">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Subheader */}
      <div className="mini-chat-subheader">빠른 분석</div>

      {/* Chat */}
      <main className="mini-chat-content">
        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={(el) => (messageRefs.current[msg.id] = el)}
            className={`mini-message mini-message--${msg.role}`}
          >
            {msg.role === "assistant" && (
              <div className="mini-message__avatar">
                <Bot size={20} />
              </div>
            )}

            <div className="mini-message__body">
              {msg.attachedData && (
                <div className="mini-message__tags">
                  {msg.attachedData.map((d) => (
                    <span key={d} className="mini-tag">
                      <FileText size={12} />
                      {d}
                    </span>
                  ))}
                </div>
              )}

              <div className="mini-message__bubble">
                {stripAsterisks(msg.content)}
                <time>
                  {msg.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              {msg.role === "assistant" &&
                msg.canGenerateReport &&
                msg.reportPayload && (
                  <button
                    type="button"
                    className="mini-report-btn"
                    onClick={() => handleGenerateReport(msg)}
                    disabled={generatingReportFor === msg.id}
                  >
                    {generatingReportFor === msg.id
                      ? "리포트 생성 중..."
                      : "리포트 생성"}
                  </button>
                )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mini-message mini-message--assistant">
            <div className="mini-message__avatar">
              <Bot size={20} />
            </div>
            <div className="mini-message__bubble mini-message__bubble--typing">
              • • •
            </div>
          </div>
        )}
      </main>

      {/* Suggested */}
      <section className="mini-suggestions">
        {suggestedQuestions.map((q) => (
          <button key={q} onClick={() => handleSend(q)}>
            {q}
          </button>
        ))}
      </section>

      {/* Selected Data Chips */}
      {selectedDataItems.length > 0 && (
        <div className="mini-selected-data">
          {selectedDataItems.map((d) => (
            <span key={d.id} className="mini-selected-chip">
              {d.title}
              <button
                type="button"
                className="mini-selected-chip__remove"
                onClick={() =>
                  setSelectedData((prev) => prev.filter((id) => id !== d.id))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="mini-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <button
          type="button"
          className="mini-input__btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요"
        />

        <button
          type="submit"
          className="mini-input__send"
          disabled={!input.trim() && selectedData.length === 0}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="mini-modal"
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mini-modal__content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <h2>분석할 데이터 선택</h2>

              <div className="mini-data-list">
                <h3 className="mini-data-section-title">Pocket에 담은 데이터</h3>

                {pocketData.length === 0 ? (
                  <div className="mini-data-empty">
                    아직 Pocket에 담긴 데이터가 없습니다.
                  </div>
                ) : (
                  pocketData.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`mini-data-card ${
                        selectedData.includes(d.id) ? "is-selected" : ""
                      }`}
                      onClick={() => toggleData(d.id)}
                    >
                      <div className="mini-data-card__main">
                        <span className="mini-data-card__title">{d.title}</span>
                        <div className="mini-data-card__tags">
                          <span className="mini-tag-page">
                            {PAGE_LABEL_MAP[d.page] ?? d.page}
                          </span>
                          <span className="mini-tag-type">
                            {ITEM_TYPE_LABEL_MAP[d.type] ?? d.type}
                          </span>
                        </div>
                      </div>
                      {selectedData.includes(d.id) && (
                        <div className="mini-data-card__check">✓</div>
                      )}
                    </button>
                  ))
                )}

                <h3 className="mini-data-section-title">
                  사용 가능한 모든 데이터
                </h3>

                {otherData.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`mini-data-card ${
                      selectedData.includes(d.id) ? "is-selected" : ""
                    }`}
                    onClick={() => toggleData(d.id)}
                  >
                    <div className="mini-data-card__main">
                      <span className="mini-data-card__title">{d.title}</span>
                      <div className="mini-data-card__tags">
                        <span className="mini-tag-page">
                          {PAGE_LABEL_MAP[d.page] ?? d.page}
                        </span>
                        <span className="mini-tag-type">
                          {ITEM_TYPE_LABEL_MAP[d.type] ?? d.type}
                        </span>
                      </div>
                    </div>
                    {selectedData.includes(d.id) && (
                      <div className="mini-data-card__check">✓</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mini-modal__footer">
                <button
                  className="mini-modal__cancel"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </button>
                <button
                  className="mini-modal__confirm"
                  onClick={() => setShowModal(false)}
                  disabled={selectedData.length === 0}
                >
                  {selectedData.length}개 선택 완료
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
