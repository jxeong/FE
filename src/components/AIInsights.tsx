import { useState, useRef, useEffect } from "react";
import { Send, Bot, Plus, FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import "../styles/AIInsights.css";
import type { InsightItem } from "../App";
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

/* ================= Types ================= */

// 도라 - 리포트 생성용 payload 저장 구조

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
  //도라
  // 이 답변 밑에 '리포트 생성' 버튼을 띄울지
  canGenerateReport?: boolean;

  // 버튼 눌렀을 때 다시 보낼 payload
  reportPayload?: ChatPayload;
}

type AISelectableData = {
  id: string;
  title: string;
  page: string;
  type: "stat" | "chart" | "table";
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

// 추천 질문
const suggestedQuestions = [
  "이번 달 매출 트렌드를 분석해주세요.",
  "Water Sleeping Mask의 아마존 순위 변동을 알려주세요.",
  "최근 일주일간 판매량이 급증한 제품이 있나요?",
  "다음 분기 전략을 제안해 주세요.",
];

// 아마존 베스트셀러 카테고리 매핑
const AMAZON_CATEGORIES = {
  all_beauty: "전체",
  lip_care: "립 케어",
  skin_care: "스킨 케어",
  lip_makeup: "립 메이크업",
  face_powder: "페이스 파우더",
} as const;
export type AmazonCategory = keyof typeof AMAZON_CATEGORIES;

// 아마존 베스트셀러 순위 관련 포맷
const categoryBestsellerData: AISelectableData[] = (
  Object.entries(AMAZON_CATEGORIES) as [AmazonCategory, string][]
).map(([category, label]) => ({
  id: `amazon-ranking-table-${category}`,
  title: `아마존 ${label} 베스트셀러 순위`,
  page: "ranking",
  type: "table",
  fetchContext: async () => {
    const categoryId = AMAZON_CATEGORY_ID_MAP[category];
    console.log("category key:", category);
    console.log("category id:", categoryId);
    const res = await fetchCurrentRanking(categoryId);

    return mapCurrentRankingToAILines(category, res);
  },
}));

// 모달창 선택 데이터
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
];

/* ================= Helpers ================= */
// 도라 저장
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
// 도라 api 함수 추가
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

// AI 답변에서 * 제거
function stripAsterisks(text: string) {
  return text.replace(/\*/g, "");
}

// 연-월 포맷 함수
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// title 정제 함수
function normalizeAITitle(title: string): string {
  return title
    .replace(
      /아마존\s+(전체|립 케어|스킨 케어|립 메이크업|페이스 파우더)\s+/,
      "아마존 "
    )
    .trim();
}

// title 정제 분기 함수
function getAITitle(item: AISelectableData): string {
  if (item.page === "ranking" && item.title.includes("순위 추이")) {
    return "제품 순위 변동 추이";
  }

  if (item.page === "ranking" && item.title.includes("베스트셀러 순위")) {
    return normalizeAITitle(item.title);
  }

  // 그 외는 그대로
  return item.title;
}

// 제품 순위 데이터 정제 함수
function mapRankingTrendToAILines(params: {
  productName: string;
  range: string;
  items?: any[];
}): string[] {
  const { productName, range, items } = params;

  const lines: string[] = [];
  lines.push(`product_name: ${productName}`);
  lines.push(`range: ${range}`);

  if (!Array.isArray(items) || items.length === 0) {
    lines.push("⚠️ 순위 데이터가 없습니다");
    return lines;
  }

  items.forEach((item) => {
    const date = item.bucket ?? item.date ?? "unknown_date";

    const hasOverall = item.rank1 != null;
    const hasCategory = item.rank2 != null;

    if (!hasOverall && !hasCategory) {
      lines.push(`${date}: rank 없음`);
      return;
    }

    const parts: string[] = [];

    if (hasOverall) {
      parts.push(`overall ${item.rank1} (${item.rank1_category})`);
    }

    if (hasCategory) {
      parts.push(`category ${item.rank2} (${item.rank2_category})`);
    }

    lines.push(`${date}: ${parts.join(", ")}`);
  });

  return lines;
}

/* ================= Component ================= */
export function AIInsights({ cartItems }: { cartItems: InsightItem[] }) {
  const pocketChartData: AISelectableData[] = cartItems
    .filter((item) => item.type === "chart" && item.page === "ranking")
    .map((item) => ({
      id: item.uniqueKey,
      title: item.title,
      page: "ranking",
      type: "chart",
      fetchContext: async () => {
        const meta = item.meta as any;

        const productId = meta?.productId; // ✅ 여기서 정의
        const range = meta?.range; // ✅ WEEK/MONTH/YEAR

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

  const aiSelectableData = [...allAvailableData, ...pocketChartData];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "안녕하세요! LANEIGE 데이터 분석 AI 어시스턴트입니다. \n왼쪽 + 버튼을 클릭하여 분석할 데이터를 선택하거나, 바로 질문해 주세요.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  //도라 추가
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

  /* ================= Send ================= */
  // 도라 - 버튼 클릭 핸들러 추가
  const handleGenerateReport = async (msg: Message) => {
    if (!msg.reportPayload) return;

    try {
      setGeneratingReportFor(msg.id);

      const res = await callGenerateReportAPI(msg.reportPayload);

      const title = (res.title?.trim() || "laneige_report").replace(
        /[\\/:*?"<>|]/g,
        "-"
      ); // 윈도우 파일명 금지문자 치환
      const filename = `${title}_${res.report_id}.md`;

      downloadMarkdown({
        filename,
        content: res.body_md ?? "",
      });
    } catch (e: any) {
      const errMsg = e?.message ?? "Unknown error";
      // 에러는 채팅에 띄우거나, 토스트로 띄우거나 선택
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

    // 선택된 데이터: id -> title (UI 태그용)
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
      // 백엔드가 허용하는 role만 사용: user / assistant
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

      // ===== DEBUG LOG =====
      console.group("AI Chat Payload Debug");
      console.log("messages:", historyForAPI);
      console.groupEnd();

      console.group("AI Payload (Final)");
      console.log(
        JSON.stringify(
          {
            messages: [...historyForAPI, userMessageForAPI],
          },
          null,
          2
        )
      );
      console.groupEnd();

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
        // 버튼 표시 여부
        canGenerateReport: canGenerate,
        // 버튼 눌렀을 때 재사용할 payload
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

  /* ================= UI Helpers ================= */

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

  /* ================= Render ================= */

  return (
    <div className="ai-insights">
      {/* ===== Chat ===== */}
      <main className="ai-chat">
        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={(el) => (messageRefs.current[msg.id] = el)}
            className={`ai-message ai-message--${msg.role}`}
          >
            {msg.role === "assistant" && (
              <div className="ai-message__avatar">
                <Bot />
              </div>
            )}

            <div className="ai-message__body">
              {msg.attachedData && (
                <div className="ai-message__tags">
                  {msg.attachedData.map((d) => (
                    <span key={d} className="ai-tag">
                      <FileText />
                      {d}
                    </span>
                  ))}
                </div>
              )}

              <div className="ai-message__bubble">
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
                    className="ai-report-btn"
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
          <div className="ai-message ai-message--assistant">
            <div className="ai-message__avatar">
              <Bot />
            </div>
            <div className="ai-message__bubble ai-message__bubble--typing">
              • • •
            </div>
          </div>
        )}
      </main>

      {/* ===== Suggested ===== */}
      <section className="ai-suggestions">
        {suggestedQuestions.map((q) => (
          <button key={q} onClick={() => handleSend(q)}>
            {q}
          </button>
        ))}
      </section>

      {/* ===== Selected Data Chips ===== */}
      {selectedDataItems.length > 0 && (
        <div className="ai-selected-data">
          {selectedDataItems.map((d) => (
            <span key={d.id} className="ai-selected-chip">
              {d.title}
              <button
                type="button"
                className="ai-selected-chip__remove"
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

      {/* ===== Input ===== */}
      <form
        className="ai-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <button
          type="button"
          className="ai-input__btn"
          onClick={() => setShowModal(true)}
        >
          <Plus />
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요"
        />

        <button
          type="submit"
          className="ai-input__send"
          disabled={!input.trim() && selectedData.length === 0}
        >
          <Send />
        </button>
      </form>

      {/* ===== Modal ===== */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="ai-modal"
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ai-modal__content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <h2>분석할 데이터 선택</h2>

              <div className="ai-data-list">
                <h3 className="ai-data-section-title">Pocket에 담은 데이터</h3>

                {pocketData.length === 0 ? (
                  <div className="ai-data-empty">
                    아직 Pocket에 담긴 데이터가 없습니다.
                  </div>
                ) : (
                  pocketData.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`ai-data-card ${
                        selectedData.includes(d.id) ? "is-selected" : ""
                      }`}
                      onClick={() => toggleData(d.id)}
                    >
                      <div className="ai-data-card__main">
                        <span className="ai-data-card__title">{d.title}</span>
                        <div className="ai-data-card__tags">
                          <span className="ai-tag">{d.page}</span>
                          <span className="ai-tag">{d.type}</span>
                        </div>
                      </div>
                      {selectedData.includes(d.id) && (
                        <div className="ai-data-card__check">✓</div>
                      )}
                    </button>
                  ))
                )}

                <h3 className="ai-data-section-title">
                  사용 가능한 모든 데이터
                </h3>

                {otherData.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`ai-data-card ${
                      selectedData.includes(d.id) ? "is-selected" : ""
                    }`}
                    onClick={() => toggleData(d.id)}
                  >
                    <div className="ai-data-card__main">
                      <span className="ai-data-card__title">{d.title}</span>
                      <div className="ai-data-card__tags">
                        <span className="ai-tag">{d.page}</span>
                        <span className="ai-tag">{d.type}</span>
                      </div>
                    </div>
                    {selectedData.includes(d.id) && (
                      <div className="ai-data-card__check">✓</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="ai-modal__footer">
                <button
                  className="ai-modal__cancel"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </button>
                <button
                  className="ai-modal__confirm"
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
    </div>
  );
}
