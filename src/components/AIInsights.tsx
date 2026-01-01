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

/* ===== 임시 더미 ===== */
const suggestedQuestions = [
  "이번 달 매출 트렌드를 분석해주세요.",
  "Water Sleeping Mask의 아마존 순위 변동을 알려주세요.",
  "최근 일주일간 판매량이 급증한 제품이 있나요?",
  "다음 분기 전략을 제안해 주세요.",
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

  const handleSend = (text = input) => {
    if (!text.trim() && selectedData.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "선택한 데이터를 분석해주세요",
      timestamp: new Date(),
      attachedData: selectedData,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          role: "assistant",
          content:
            "현재는 더미 응답입니다.\n백엔드 연결 시 실제 분석 결과가 표시됩니다.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
      setSelectedData([]);
    }, 1200);
  };

  const toggleData = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

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
