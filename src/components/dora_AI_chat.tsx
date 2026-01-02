import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Plus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { InsightItem } from '../App';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachedData?: string[];
}

/** ===== API payload types ===== */
type ChatMessageForAPI = {
  role: 'user' | 'assistant';
  content: string;
  attachedData?: string[];
};

type ChatRequest = {
  messages: ChatMessageForAPI[];
  selectedDataIds?: string[];
  selectedDataTitles?: string[];
};

type ChatResponse = {
  answer: string
};

const suggestedQuestions = [
  '이번 달 매출 트렌드를 분석해주세요',
  'Water Sleeping Mask의 성과를 평가해주세요',
  '경쟁사 대비 우리의 위치는 어떤가요?',
  '다음 분기 전략을 제안해주세요',
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

interface AIInsightsProps {
  cartItems: InsightItem[];
}

/** ===== API call helper ===== */
async function callChatAPI(payload: any): Promise<string> {
  const res = await fetch('http://boradora.store/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  return data.answer; // ✅ 백에서 answer로 내려줌
}

export function AIInsights({ cartItems }: AIInsightsProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '안녕하세요! LANEIGE 데이터 분석 AI 어시스턴트입니다. 왼쪽 + 버튼을 클릭하여 분석할 데이터를 선택하거나, 바로 질문해주세요.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /** ===== send (now async) ===== */
  const handleSend = async (text: string = input) => {
    if (!text.trim() && selectedData.length === 0) return;

    // 선택된 데이터: id -> title
    const attachedDataTitles = selectedData.map((id) => {
      const item = allAvailableData.find((d) => d.id === id);
      return item?.title || id;
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || '선택한 데이터를 분석해주세요',
      timestamp: new Date(),
      attachedData: selectedData.length > 0 ? attachedDataTitles : undefined,
    };

    // UI에 먼저 user message 추가
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // ✅ 최신 히스토리(기존 messages + 방금 보낸 userMessage)를 API로 보냄
      const historyForAPI: ChatMessageForAPI[] = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
        attachedData: m.attachedData,
      }));

      const reply = await callChatAPI({
        messages: historyForAPI,
        selectedDataIds: selectedData,
        selectedDataTitles: attachedDataTitles,
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (e: any) {
      const errMsg = e?.message ?? 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `에러가 발생했어요: ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setSelectedData([]);
    }
  };

  const toggleDataSelection = (id: string) => {
    setSelectedData((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const cartDataIds = cartItems.map((item) => item.uniqueKey);
  const otherData = allAvailableData.filter((data) => !cartDataIds.includes(data.id));

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="p-8 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#6691ff] rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl">AI 인사이트 리포트</h1>
        </div>
        <p className="text-gray-600">데이터 기반 전략 분석 및 제안</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-gray-200' : 'bg-[#6691ff]'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-gray-700" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`inline-block max-w-3xl ${message.role === 'user' ? '' : 'w-full'}`}>
                  {message.attachedData && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.attachedData.map((data, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-[#6691ff] rounded-full text-sm"
                        >
                          <FileText className="w-3 h-3" />
                          {data}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl ${
                      message.role === 'user' ? 'bg-[#6691ff] text-white' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    <span
                      className={`text-xs mt-2 block ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}
                    >
                      {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6691ff] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length === 1 && (
        <div className="px-8 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-3">추천 질문:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(question)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-[#6691ff] transition-colors text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-8 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          {selectedData.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600">선택된 데이터:</span>
              {selectedData.map((id) => {
                const item = allAvailableData.find((d) => d.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#6691ff] rounded-full text-sm"
                  >
                    <FileText className="w-3 h-3" />
                    {item?.title}
                    <button onClick={() => toggleDataSelection(id)} className="hover:text-red-500 transition-colors">
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setShowDataModal(true)}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="질문을 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6691ff] focus:border-transparent"
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() && selectedData.length === 0 || isTyping}
              className="px-6 py-3 bg-[#6691ff] text-white rounded-lg hover:bg-[#5580ee] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              전송
            </button>
          </div>
        </div>
      </div>

      {/* Data Selection Modal */}
      <AnimatePresence>
        {showDataModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDataModal(false)}
              className="fixed inset-0 bg-black bg-opacity-30 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl mb-2">분석할 데이터 선택</h2>
                  <p className="text-gray-600 text-sm">분석에 포함할 데이터를 선택하세요</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Cart Items */}
                  {cartItems.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm text-gray-600 mb-3">Pocket에 담은 데이터</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {cartItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => toggleDataSelection(item.uniqueKey)}
                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                              selectedData.includes(item.uniqueKey)
                                ? 'border-[#6691ff] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="mb-1">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="px-2 py-0.5 bg-gray-100 rounded">{item.page}</span>
                                  <span className="px-2 py-0.5 bg-gray-100 rounded">{item.type}</span>
                                </div>
                              </div>
                              {selectedData.includes(item.uniqueKey) && (
                                <div className="w-6 h-6 bg-[#6691ff] rounded-full flex items-center justify-center text-white text-sm">
                                  ✓
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Data */}
                  <div>
                    <h3 className="text-sm text-gray-600 mb-3">사용 가능한 모든 데이터</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {otherData.map((data) => (
                        <button
                          key={data.id}
                          onClick={() => toggleDataSelection(data.id)}
                          className={`text-left p-4 rounded-lg border-2 transition-all ${
                            selectedData.includes(data.id)
                              ? 'border-[#6691ff] bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="mb-1">{data.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="px-2 py-0.5 bg-gray-100 rounded">{data.page}</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded">{data.type}</span>
                              </div>
                            </div>
                            {selectedData.includes(data.id) && (
                              <div className="w-6 h-6 bg-[#6691ff] rounded-full flex items-center justify-center text-white text-sm">
                                ✓
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setShowDataModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowDataModal(false)}
                    className="flex-1 py-3 bg-[#6691ff] text-white rounded-lg hover:bg-[#5580ee] transition-colors"
                  >
                    선택 완료 ({selectedData.length})
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}