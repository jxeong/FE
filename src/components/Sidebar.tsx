import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Search,
  Star,
} from "lucide-react";
import type { PageType } from "../App";
import "../styles/Sidebar.css";
import laneigeLogo from "../assets/laneigeLogo.svg";
import { Download } from "lucide-react";
import { API_BASE_URL } from "../config/api";

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const menuItems = [
  {
    id: "dashboard" as PageType,
    label: "요약 대시보드",
    icon: LayoutDashboard,
  },
  { id: "ranking" as PageType, label: "랭킹 히스토리", icon: TrendingUp },
  { id: "ai-insights" as PageType, label: "AI 인사이트", icon: MessageSquare },
  { id: "review-analysis" as PageType, label: "리뷰 분석", icon: Star },
  { id: "keywords" as PageType, label: "키워드 분석", icon: Search },
];

const handleDownloadExcel = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reports/daily/today/download`);

    if (!res.ok) {
      throw new Error("다운로드 실패");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "laneige_daily_report.md"; // 저장될 파일명
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert("엑셀 다운로드 중 오류가 발생했습니다.");
  }
};

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
              className={`sidebar__item ${isActive ? "is-active" : ""}`}
            >
              <Icon className="sidebar__icon" />
              <span className="sidebar__label">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <footer className="sidebar__footer">
        <button onClick={handleDownloadExcel} className="sidebar__footer-item">
          <Download className="sidebar__footer-icon" />
          <span>오늘의 리포트 저장</span>
        </button>

        <button className="sidebar__footer-item">
          <Download className="sidebar__footer-icon" />
          <span>누적 데이터 엑셀 저장</span>
        </button>
      </footer>
    </aside>
  );
}
