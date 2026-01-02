import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Plus, FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import "../styles/AIInsights.css";
import type { InsightItem } from "../App";
import {
  fetchTop1BestSellerAIContext,
  fetchRisingProductItemAIContext,
} from "../api/dashboard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachedData?: string[];
}

/** ===== API payload types ===== */
type ChatMessageForAPI = {
  role: "user" | "assistant";
  content: string;
  attachedData?: string[];
};

type ChatRequest = {
  messages: ChatMessageForAPI[];
  selectedDataIds?: string[];
  selectedDataTitles?: string[];
};

type ChatResponse = {
  answer: string;
};

type AISelectableData = {
  id: string;
  title: string;
  page: string;
  type: "stat" | "chart" | "table";

  fetchContext: () => Promise<any>;
};

/* ===== 임시 더미 ===== */
const suggestedQuestions = [
  "이번 달 매출 트렌드를 분석해주세요.",
  "Water Sleeping Mask의 아마존 순위 변동을 알려주세요.",
  "최근 일주일간 판매량이 급증한 제품이 있나요?",
  "다음 분기 전략을 제안해 주세요.",
];

const allAvailableData: AISelectableData[] = [
  {
    id: "dashboard-stat-sales",
    title: "지난 달 총 판매량",
    page: "dashboard",
    type: "stat",
    fetchContext: "[더미데이터] 지난 달 라네즈 제품 총 판매량: 21,400개",
  },
  {
    id: "dashboard-stat-revenue",
    title: "지난 달 매출액",
    page: "dashboard",
    type: "stat",
    fetchContext: "[더미데이터] 지난 달 라네즈 제품 총 매출액: $145,242",
  },
  {
    id: "dashboard-product-of-month",
    title: "이달의 제품",
    page: "dashboard",
    type: "stat",
    fetchContext: async () => {
      const ctx = await fetchTop1BestSellerAIContext("2026-01");
      return ctx;
    },
  },
  {
    id: "dashboard-rising-product",
    title: "급상승한 제품",
    page: "dashboard",
    type: "stat",
    fetchContext: async () => {
      const ctx = await fetchRisingProductItemAIContext("2026-01");
      return ctx;
    },
  },
];

/* ============================================ */

interface AIInsightsProps {
  cartItems: InsightItem[];
}

/** ===== API call helper ===== */
async function callChatAPI(payload: any): Promise<string> {
  const res = await fetch("https://boradora.store/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  return data.answer;
}

async function buildContextValues(
  selectedIds: string[]
): Promise<Record<string, any>> {
  const entries = await Promise.all(
    selectedIds.map(async (id) => {
      const item = allAvailableData.find((d) => d.id === id);
      if (!item) return null;

      const data = await item.fetchContext();
      return [id, data] as const;
    })
  );

  return Object.fromEntries(entries.filter(Boolean) as Array<[string, any]>);
}

export function AIInsights({ cartItems }: AIInsightsProps) {
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
  const endRef = useRef<HTMLDivElement>(null);

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const chat = document.querySelector(".ai-chat");
    if (chat) {
      chat.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const el = messageRefs.current[lastMessage.id];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() && selectedData.length === 0) return;

    // 선택된 데이터: id -> title
    const attachedDataTitles = selectedData.map((id) => {
      const item = allAvailableData.find((d) => d.id === id);
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
      // 최신 히스토리(기존 messages + 방금 보낸 userMessage)를 API로 보냄
      const historyForAPI: ChatMessageForAPI[] = [...messages, userMessage].map(
        (m) => ({
          role: m.role,
          content: m.content,
          attachedData: m.attachedData,
        })
      );

      // 선택된 데이터에 대해 API 호출
      const contextValues =
        selectedData.length > 0
          ? await buildContextValues(selectedData)
          : undefined;

      // ===== DEBUG LOG =====
      console.group("AI Chat Payload Debug");
      console.log("messages:", historyForAPI);
      console.log("selectedDataIds:", selectedData);
      console.log("selectedDataTitles:", attachedDataTitles);
      console.log("contextValues:", contextValues);
      console.groupEnd();

      const reply = await callChatAPI({
        messages: historyForAPI,
        selectedDataIds: selectedData,
        selectedDataTitles: attachedDataTitles,
        contextValues,
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
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

  const pocketData = allAvailableData.filter((d) => cartDataIds.includes(d.id));
  const otherData = allAvailableData.filter((d) => !cartDataIds.includes(d.id));

  const selectedDataItems = selectedData
    .map((id) => allAvailableData.find((d) => d.id === id))
    .filter(Boolean);

  return (
    <div className="ai-insights">
      {/* ===== Chat ===== */}
      <main className="ai-chat">
        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={(el) => {
              messageRefs.current[msg.id] = el;
            }}
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
                {msg.content}
                <time>
                  {msg.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
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

        <div ref={endRef} />
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
                {/* ===== Pocket 섹션 ===== */}
                <h3 className="ai-data-section-title">Pocket에 담은 데이터</h3>

                {pocketData.length === 0 ? (
                  <div className="ai-data-empty">
                    아직 Pocket에 담긴 데이터가 없습니다. + 버튼을 눌러 데이터를
                    담아보세요!
                  </div>
                ) : (
                  pocketData.map((d) => {
                    const isSelected = selectedData.includes(d.id);

                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`ai-data-card ${
                          isSelected ? "is-selected" : ""
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

                        {isSelected && (
                          <div className="ai-data-card__check">✓</div>
                        )}
                      </button>
                    );
                  })
                )}

                {/* ===== 사용 가능한 모든 데이터 ===== */}
                <h3 className="ai-data-section-title">
                  사용 가능한 모든 데이터
                </h3>

                {otherData.map((d) => {
                  const isSelected = selectedData.includes(d.id);

                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`ai-data-card ${
                        isSelected ? "is-selected" : ""
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

                      {isSelected && (
                        <div className="ai-data-card__check">✓</div>
                      )}
                    </button>
                  );
                })}
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
