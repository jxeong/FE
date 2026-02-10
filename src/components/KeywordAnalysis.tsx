import { useState } from 'react';
import '../styles/KeywordAnalysis.css';
import { AddToCartButton } from './AddToCartButton';
import type { InsightItem } from '../App';

interface KeywordData {
  rank: number;
  keyword: string;
  mentions: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

interface KeywordAnalysisProps {
  addToCart: (item: Omit<InsightItem, 'id' | 'timestamp'>) => void;
  removeByUniqueKey: (uniqueKey: string) => void;
  isInCart: (uniqueKey: string) => boolean;
}

export function KeywordAnalysis({ addToCart, removeByUniqueKey, isInCart }: KeywordAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체 카테고리');
  const [sortBy, setSortBy] = useState('전체 카테고리');

  const allKeywords: KeywordData[] = [
    { rank: 1, keyword: 'hydration', mentions: 8956, trend: 'up', change: 12.3, sentiment: 'positive', category: 'Product Benefit' },
    { rank: 2, keyword: 'sleeping mask', mentions: 7234, trend: 'up', change: 8.7, sentiment: 'positive', category: 'Product Type' },
    { rank: 3, keyword: 'moisturizing', mentions: 6542, trend: 'stable', change: 0.2, sentiment: 'positive', category: 'Product Type' },
    { rank: 4, keyword: 'soft skin', mentions: 5876, trend: 'up', change: 15.4, sentiment: 'positive', category: 'Result' },
    { rank: 5, keyword: 'overnight', mentions: 5234, trend: 'up', change: 6.8, sentiment: 'positive', category: 'Usage' },
    { rank: 6, keyword: 'lip care', mentions: 4987, trend: 'up', change: 18.9, sentiment: 'positive', category: 'Product Type' },
    { rank: 7, keyword: 'price', mentions: 4654, trend: 'down', change: -3.2, sentiment: 'neutral', category: 'Purchase Factor' },
    { rank: 8, keyword: 'texture', mentions: 4321, trend: 'stable', change: 1.1, sentiment: 'positive', category: 'Purchase Feature' },
    { rank: 9, keyword: 'absorption', mentions: 4156, trend: 'up', change: 9.3, sentiment: 'positive', category: 'Purchase Feature' },
    { rank: 10, keyword: 'fragrance', mentions: 3987, trend: 'stable', change: -0.5, sentiment: 'positive', category: 'Purchase Feature' },
    { rank: 11, keyword: 'dry skin', mentions: 3765, trend: 'up', change: 7.2, sentiment: 'positive', category: 'Skin concern' },
    { rank: 12, keyword: 'packaging', mentions: 3542, trend: 'down', change: -2.1, sentiment: 'neutral', category: 'Product Feature' },
    { rank: 13, keyword: 'k-beauty', mentions: 3421, trend: 'up', change: 11.5, sentiment: 'positive', category: 'Brand Image' },
    { rank: 14, keyword: 'morning glow', mentions: 3298, trend: 'up', change: 14.2, sentiment: 'positive', category: 'Result' },
    { rank: 15, keyword: 'value for money', mentions: 3156, trend: 'down', change: -4.8, sentiment: 'neutral', category: 'Purchase Factor' },
    { rank: 16, keyword: 'gentle', mentions: 3045, trend: 'stable', change: 0.8, sentiment: 'positive', category: 'Product Feature' },
    { rank: 17, keyword: 'sensitive skin', mentions: 2934, trend: 'up', change: 5.6, sentiment: 'positive', category: 'Skin Concern' },
    { rank: 18, keyword: 'sticky', mentions: 2876, trend: 'down', change: -6.3, sentiment: 'negative', category: 'Product Feature' },
    { rank: 19, keyword: 'long-lasting', mentions: 2765, trend: 'up', change: 10.1, sentiment: 'positive', category: 'Product Benefit' },
    { rank: 20, keyword: 'cooling effect', mentions: 2654, trend: 'up', change: 8.9, sentiment: 'positive', category: 'Product Feature' },
  ];

  // 카테고리별 데이터 집계
  const categoryData = {
    'Product Benefit': 11621,
    'Product Type': 18763,
    'Product Feature': 12463,
    'Result': 9174,
    'Skin Concern': 6699,
  };

  // 필터링된 키워드
  const filteredKeywords = allKeywords.filter(keyword => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체 카테고리' || keyword.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['전체 카테고리', 'Product Benefit', 'Product Type', 'Result', 'Usage', 'Purchase Factor', 'Purchase Feature', 'Skin Concern', 'Brand Image', 'Product Feature'];

  return (
    <div className="keyword-analysis">
      <main className="keyword-analysis__main">
        {/* 카테고리별 키워드 분포 차트 */}
        <section className="chart-section">
          <div className="chart-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="chart-title">카테고리별 키워드 분포</h2>
            <AddToCartButton
              onAdd={() => addToCart({
                type: 'chart',
                title: '카테고리별 키워드 분포',
                data: categoryData,
                page: 'keywords',
                uniqueKey: 'keyword-category-distribution',
              })}
              onRemove={() => removeByUniqueKey('keyword-category-distribution')}
              isInCart={isInCart('keyword-category-distribution')}
            />
          </div>
          <div className="bar-chart">
            <div className="chart-bars">
              {/* 가로선과 수치 */}
              <div className="horizontal-lines">
                <div className="horizontal-line" style={{ bottom: '80%' }}><span>16000</span></div>
                <div className="horizontal-line" style={{ bottom: '60%' }}><span>12000</span></div>
                <div className="horizontal-line" style={{ bottom: '40%' }}><span>8000</span></div>
                <div className="horizontal-line" style={{ bottom: '20%' }}><span>4000</span></div>
                <div className="horizontal-line" style={{ bottom: '0%' }}><span>0</span></div>
              </div>
              {Object.entries(categoryData).map(([category, value]) => (
                <div key={category} className="bar-item">
                  <div className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ height: `${(value / 20000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bar-labels">
              {Object.keys(categoryData).map((category) => (
                <span key={category} className="bar-label">{category}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 키워드 테이블 섹션 */}
        <section className="keyword-section">
          <div className="keyword-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="keyword-title">키워드 순위</h2>
            <AddToCartButton
              onAdd={() => addToCart({
                type: 'table',
                title: '키워드 순위',
                data: allKeywords,
                page: 'keywords',
                uniqueKey: 'keyword-rankings-table',
              })}
              onRemove={() => removeByUniqueKey('keyword-rankings-table')}
              isInCart={isInCart('keyword-rankings-table')}
            />
          </div>

          <div className="keyword-filters">
            <div className="filter-search">
              <svg className="search-icon" width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="10" cy="10" r="7" stroke="#7A7A7A" strokeWidth="1.5"/>
                <path d="M19.25 19.25L15.2625 15.2625" stroke="#7A7A7A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input 
                type="text" 
                placeholder="키워드 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-dropdown">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <svg className="dropdown-icon" width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 4L6 8L10 4" fill="#383838"/>
              </svg>
            </div>
          </div>

          {/* 테이블 헤더 */}
          <div className="review-table-header">
            <span className="col-rank">순위</span>
            <span className="col-keyword">키워드</span>
            <span className="col-mentions">언급수</span>
            <span className="col-trend">트렌드</span>
            <span className="col-change">변화율</span>
            <span className="col-sentiment">감정</span>
            <span className="col-category">카테고리</span>
          </div>

          {/* 테이블 바디 */}
          <div className="review-table-body">
            {filteredKeywords.map((item) => (
              <div key={item.rank} className="review-table-row">
                <div className="review-col-rank">
                  <span className={`rank-badge ${item.rank <= 3 ? 'rank-badge--top' : 'rank-badge--normal'}`}>
                    {item.rank}
                  </span>
                </div>
                <div className="col-keyword">
                  <span className={item.rank <= 3 ? 'text-primary' : ''}>{item.keyword}</span>
                </div>
                <div className="col-mentions">
                  <span className={item.rank <= 3 ? 'text-primary' : ''}>{item.mentions.toLocaleString()}</span>
                </div>
                <div className="col-trend">
                  {item.trend === 'up' && (
                    <div className="trend trend--up">
                      <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <path d="M10.5 16.625V4.375" stroke="#13C85E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 8.5L10.5 4.375L15 8.5" stroke="#13C85E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>up</span>
                    </div>
                  )}
                  {item.trend === 'down' && (
                    <div className="trend trend--down">
                      <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <path d="M10.5 4.375V16.625" stroke="#FF2F36" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 12.5L10.5 16.625L15 12.5" stroke="#FF2F36" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>down</span>
                    </div>
                  )}
                  {item.trend === 'stable' && (
                    <div className="trend trend--stable">
                      <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                        <line x1="0.5" y1="1" x2="9.5" y2="1" stroke="#7A7A7A" strokeLinecap="round"/>
                      </svg>
                      <span>stable</span>
                    </div>
                  )}
                </div>
                <div className="col-change">
                  <span className={
                    item.change > 0 ? 'change-positive' : 
                    item.change < 0 ? 'change-negative' : 
                    'change-neutral'
                  }>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
                <div className="col-sentiment">
                  <span className={`sentiment-badge sentiment-badge--${item.sentiment}`}>
                    {item.sentiment}
                  </span>
                </div>
                <div className="col-category">
                  <span className={item.rank <= 3 ? 'text-primary' : ''}>{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
