import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Plus, FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import "../styles/AIInsights.css";
import type { InsightItem } from "../App";

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

/* ===== 임시 더미 ===== */
const suggestedQuestions = [
  "이번 달 매출 트렌드를 분석해주세요.",
  "Water Sleeping Mask의 아마존 순위 변동을 알려주세요.",
  "최근 일주일간 판매량이 급증한 제품이 있나요?",
  "다음 분기 전략을 제안해 주세요.",
];

const allAvailableData = [
  { id: 'dashboard-stat-sales', title: '총 판매량', page: 'dashboard', type: 'stat' },
  { id: 'dashboard-stat-revenue', title: '매출액', page: 'dashboard', type: 'stat' },
  { id: 'dashboard-product-of-month', title: '이달의 제품', page: 'dashboard', type: 'stat' },
  { id: 'dashboard-rising-product', title: '급상승한 제품', page: 'dashboard', type: 'stat' },
  { id: 'dashboard-chart-monthly-sales', title: '지난 달 판매 추이', page: 'dashboard', type: 'chart' },
  { id: 'dashboard-table-top5', title: '베스트 셀러 TOP 5', page: 'dashboard', type: 'table' },
  { id: 'dashboard-table-details', title: '제품별 상세 현황', page: 'dashboard', type: 'table' },
  { id: 'ranking-table-amazon-current', title: '아마존 현재 순위', page: 'ranking', type: 'table' },
  { id: 'review-sentiment-chart', title: '감정 분석 분포', page: 'review', type: 'chart' },
  { id: 'review-reputation-score', title: '평판 지수', page: 'review', type: 'stat' },
  { id: 'review-rating-distribution', title: '평점 분포', page: 'review', type: 'chart' },
  { id: 'review-keyword-analysis', title: 'AI 키워드 분석', page: 'review', type: 'table' },
];

const availableData = [
  { id: "sales-total", title: "총 판매량", page: "dashboard", type: "stat" },
  {
    id: "amazon-ranking",
    title: "아마존 현재 순위",
    page: "ranking",
    type: "table",
  },
];
/* ============================================ */

interface AIInsightsProps {
  cartItems: InsightItem[];
}

/** ===== API call helper ===== */
async function callChatAPI(payload: any): Promise<string> {
  const res = await fetch("http://boradora.store/api/chat", {
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
      const item = availableData.find((d) => d.id === id);
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

      const reply = await callChatAPI({
        messages: historyForAPI,
        selectedDataIds: selectedData,
        selectedDataTitles: attachedDataTitles,
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
  const otherData = allAvailableData.filter(
    (data) => !cartDataIds.includes(data.id)
  );

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
          <motion.div className="ai-modal" onClick={() => setShowModal(false)}>
            <motion.div
              className="ai-modal__content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>분석할 데이터 선택</h2>

              {availableData.map((d) => (
                <button
                  key={d.id}
                  className={`ai-data-item ${
                    selectedData.includes(d.id) ? "is-selected" : ""
                  }`}
                  onClick={() => toggleData(d.id)}
                >
                  {d.title}
                </button>
              ))}

              <button
                className="ai-modal__close"
                onClick={() => setShowModal(false)}
              >
                선택 완료 ({selectedData.length})
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
