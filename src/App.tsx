import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RankingHistory } from './components/RankingHistory';
import { ReviewAnalysis } from './components/ReviewAnalysis';
import { AIInsights } from './components/AIInsights';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { InsightCart } from './components/InsightCart';

export type PageType = 'dashboard' | 'ranking' | 'review-analysis' | 'ai-insights' | 'keywords';

export interface InsightItem {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'insight';
  title: string;
  data: any;
  page: PageType;
  timestamp: Date;
  uniqueKey: string;
  meta?: Record<string, any>;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [cartItems, setCartItems] = useState<InsightItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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
    </div>
  );
}