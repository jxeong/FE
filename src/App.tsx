import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RankingHistory } from './components/RankingHistory';
import { ReviewAnalysis } from './components/ReviewAnalysis';
import { AIInsights } from './components/AIInsights';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { InsightCart } from './components/InsightCart';
import { FloatingChatButton } from './components/FloatingChatButton';
import { MiniChatWindow } from './components/MiniChatWindow';
import { AnimatePresence } from 'motion/react';
import type { CategoryCode } from "./components/RankingHistory";
import type { RankRange } from "./components/RankingHistory";

const CART_STORAGE_KEY = "insight-pocket-cart-v1";

export type PageType = 'dashboard' | 'ranking' | 'review-analysis' | 'ai-insights' | 'keywords';

export interface InsightMeta {
  kind: string;
  month?: string;

  productId?: number;
  range?: RankRange;
  period?: "weekly" | "monthly" | "yearly";
  productName?: string;

  categoryCode?: CategoryCode;
  categoryId?: number;
}

export interface InsightItem {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'insight';
  title: string;
  data: any;
  page: PageType;
  timestamp: Date;
  uniqueKey: string;
  meta?: InsightMeta;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [cartItems, setCartItems] = useState<InsightItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as any[];

      return parsed.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })) as InsightItem[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // 용량/프라이빗 모드 등 예외 무시
    }
  }, [cartItems]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false);

  const addToCart = (item: Omit<InsightItem, 'id' | 'timestamp'>) => {
    const newItem: InsightItem = {
      ...item,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeByUniqueKey = (uniqueKey: string) => {
    setCartItems((prev) => prev.filter((item) => item.uniqueKey !== uniqueKey));
  };

  const isInCart = (uniqueKey: string) => {
    return cartItems.some((item) => item.uniqueKey === uniqueKey);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Hide cart on AI Insights page
  const showCart = currentPage !== 'ai-insights';

  // Show floating chat button on all pages except AI Insights
  const showFloatingChat = currentPage !== 'ai-insights';

  const handleNavigateToAI = () => {
    setIsMiniChatOpen(false);
    setCurrentPage('ai-insights');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && (
          <Dashboard 
            addToCart={addToCart} 
            removeByUniqueKey={removeByUniqueKey}
            isInCart={isInCart}
          />
        )}
        {currentPage === 'ranking' && (
          <RankingHistory 
            addToCart={addToCart}
            removeByUniqueKey={removeByUniqueKey}
            isInCart={isInCart}
          />
        )}
        {currentPage === 'review-analysis' && (
          <ReviewAnalysis 
            addToCart={addToCart}
            removeByUniqueKey={removeByUniqueKey}
            isInCart={isInCart}
          />
        )}
        {currentPage === 'ai-insights' && (
          <AIInsights cartItems={cartItems} />
        )}
        {currentPage === 'keywords' && <KeywordAnalysis 
          addToCart={addToCart}
          removeByUniqueKey={removeByUniqueKey}
          isInCart={isInCart}
        />}
      </main>
      {showCart && (
        <InsightCart
          items={cartItems}
          isOpen={isCartOpen}
          onToggle={() => setIsCartOpen(!isCartOpen)}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
      )}

      {showFloatingChat && !isCartOpen && (
        <>
          <FloatingChatButton onClick={() => setIsMiniChatOpen(!isMiniChatOpen)} />
          <AnimatePresence>
            {isMiniChatOpen && (
              <MiniChatWindow
                cartItems={cartItems}
                onClose={() => setIsMiniChatOpen(false)}
                onNavigateToAI={handleNavigateToAI}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}