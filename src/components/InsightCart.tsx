import { useState } from "react";
import { Briefcase, ShoppingCart, FileSpreadsheet, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { InsightItem } from "../App";
import * as XLSX from "xlsx";

import { PAGE_LABEL_MAP, ITEM_TYPE_LABEL_MAP } from "../utils/label";
import { formatExcelTimestamp } from "../utils/date";
import { buildExcelSheetData } from "../utils/excel/buildExcelSheet";

import { InsightCartItem } from "./InsightCartItem";
import { InsightCartLoading } from "./InsightCartLoading";

import "../styles/InsightCart.css";
import bagIcon from "../assets/bag.svg";
import docsIcon from "../assets/docs.svg";
import trashIcon from "../assets/trash.svg";

interface InsightCartProps {
  items: InsightItem[];
  isOpen: boolean;
  onToggle: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function InsightCart({
  items,
  isOpen,
  onToggle,
  onRemove,
  onClear,
}: InsightCartProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /* =====================
     Derived State
  ===================== */
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  /* =====================
     Selection Logic
  ===================== */
  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : items.map((item) => item.id));
  };

  /* =====================
     Excel Generation
  ===================== */
  const generateExcel = async () => {
    if (selectedItems.length === 0) return;

    setIsGenerating(true);
    setIsTimeout(false);

    await new Promise((r) => setTimeout(r, 3000));

    const timeoutId = setTimeout(() => {
      setIsGenerating(false);
      setIsTimeout(true);
    }, 15000);

    try {
      /* ===== Workbook 생성 ===== */
      const wb = XLSX.utils.book_new();

      /* ===== Summary ===== */
      const summaryData = [
        ["LANEIGE Amazon 데이터 분석 자료"],
        ["Generated:", new Date().toLocaleString("ko-KR")],
        ["Total Cards:", selectedItems.length],
        [""],
        ["Page", "Card Type", "Title", "Added Time"],
        ...selectedItems.map((item) => [
          PAGE_LABEL_MAP[item.page] ?? item.page,
          ITEM_TYPE_LABEL_MAP[item.type] ?? item.type,
          item.title,
          item.timestamp.toLocaleString("ko-KR"),
        ]),
      ];

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(summaryData),
        "Summary"
      );

      /* ===== Item Sheets ===== */
      for (let idx = 0; idx < selectedItems.length; idx++) {
        const item = selectedItems[idx];

        // 카드별로 현재 데이터를 다시 조회해서 시트 데이터 만들기
        const data: any[][] = await buildExcelSheetData(item);

        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.aoa_to_sheet(data),
          `Card_${idx + 1}`
        );
      }

      /* ===== 파일 저장 ===== */
      const timestamp = formatExcelTimestamp();
      XLSX.writeFile(wb, `LANEIGE_Insights_${timestamp}.xlsx`);

      clearTimeout(timeoutId);

      setIsGenerating(false);
      setSelectedIds([]);
      onClear();
    } catch (e) {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      setIsTimeout(true);
    }
  };

  return (
    <>
      {/* ================= Floating Button ================= */}
      <motion.button
        onClick={onToggle}
        className="ic-fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <img src={bagIcon} alt="" className="ic-fab-icon" />
        {items.length > 0 && (
          <span className="ic-fab__count">{items.length}</span>
        )}
      </motion.button>

      {/* ================= Drawer ================= */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="ic-backdrop" onClick={onToggle} />

            <motion.div
              className="ic-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "tween",
                ease: "easeInOut",
                duration: 0.35,
              }}
            >
              {/* ===== Header ===== */}
              <header className="ic-header">
                <div className="ic-header__top">
                  <div className="ic-header__title">
                    <img src={bagIcon} alt="" className="ic-btn__icon" />
                    <h2>Insight Pocket</h2>
                  </div>
                  <button onClick={onToggle} className="ic-header__close">
                    ×
                  </button>
                </div>
                <p className="ic-header__desc">
                  {items.length}개의 인사이트가 담겨 있습니다.
                </p>
              </header>

              {/* ===== Select Bar ===== */}
              {items.length > 0 && (
                <div className="ic-select-bar">
                  <div className="ic-select-all">
                    <label className="ic-select-all__check">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                      <span className="ic-checkbox" />
                    </label>
                    <button
                      className="ic-select-all-btn"
                      onClick={toggleSelectAll}
                    >
                      {isAllSelected ? "전체 해제" : "전체 선택"}
                    </button>
                  </div>

                  <span className="ic-select-count">
                    {selectedIds.length}/{items.length} 선택됨
                  </span>
                </div>
              )}

              {/* ===== Item List ===== */}
              <section className="ic-list">
                {items.length === 0 ? (
                  <div className="ic-empty">담긴 인사이트가 없습니다.</div>
                ) : (
                  items.map((item) => (
                    <InsightCartItem
                      key={item.id}
                      item={item}
                      checked={selectedIds.includes(item.id)}
                      onToggle={toggleItem}
                      onRemove={onRemove}
                    />
                  ))
                )}
              </section>

              {/* ===== Footer ===== */}
              {items.length > 0 && (
                <footer className="ic-footer">
                  <button
                    className="ic-btn ic-btn--primary"
                    disabled={isGenerating || selectedItems.length === 0}
                    onClick={generateExcel}
                  >
                    <img src={docsIcon} alt="" className="ic-btn__icon" />
                    엑셀 파일 다운로드 ({selectedItems.length})
                  </button>

                  <button
                    className="ic-btn ic-btn--ghost"
                    onClick={() => {
                      setSelectedIds([]);
                      onClear();
                    }}
                  >
                    <img src={trashIcon} alt="" className="ic-btn__icon" />
                    전체 삭제
                  </button>
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <InsightCartLoading visible={isGenerating} />
      <AnimatePresence>
        {isTimeout && (
          <motion.div
            className="ic-timeout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ic-timeout__modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3>앗! 엑셀 파일이 만들어지지 않았어요</h3>
              <p>다시 시도해 주세요.</p>

              <button
                className="ic-btn ic-btn--primary"
                onClick={() => {
                  setIsTimeout(false);
                  onToggle(); // drawer 닫기
                }}
              >
                메인으로 돌아가기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
