import { LayoutDashboard, TrendingUp, MessageSquare, Search, Star } from 'lucide-react';
import type { PageType } from '../App';
import '../styles/Sidebar.css';
import laneigeLogo from '../assets/laneigeLogo.png';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const menuItems = [
  { id: 'dashboard' as PageType, label: '요약 대시보드', icon: LayoutDashboard },
  { id: 'ranking' as PageType, label: '랭킹 히스토리', icon: TrendingUp },
  { id: 'ai-insights' as PageType, label: 'AI 인사이트', icon: MessageSquare },
  { id: 'review-analysis' as PageType, label: '리뷰 분석', icon: Star },
  { id: 'keywords' as PageType, label: '키워드 분석', icon: Search },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <img
          src={laneigeLogo}
          alt="LANEIGE Insight Pocket"
          className="sidebar__logo"
        />
      </div>

      <nav className="sidebar__nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`sidebar__item ${isActive ? 'is-active' : ''}`}
            >
              <Icon className="sidebar__icon" />
              <span className="sidebar__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <footer className="sidebar__footer">
        <p className="sidebar__updated-label">Last updated</p>
        <p className="sidebar__updated-date">December 22, 2024</p>
      </footer>
    </aside>
  );
}
