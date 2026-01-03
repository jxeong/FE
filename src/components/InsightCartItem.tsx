import { motion } from "motion/react";
import type { InsightItem } from "../App";

interface Props {
  item: InsightItem;
  onRemove: (id: string) => void;
  checked: boolean;
  onToggle: (id: string) => void;
}

export function InsightCartItem({ item, onRemove, checked, onToggle }: Props) {
  return (
    <motion.div
      className={`ic-item ${checked ? "is-selected" : ""}`}
      onClick={() => onToggle(item.id)}
      whileTap={{ scale: 0.98 }}
    >
      <div className="ic-item__content">
        <div className="ic-item__header">
          <div className="ic-item__meta">
            <span className="ic-item__page">{item.page}</span>
            <span className="ic-item__type">{item.type}</span>
          </div>

          <button
            className="ic-item__remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            aria-label="삭제"
          >
            ×
          </button>
        </div>

        <h4 className="ic-item__title">{item.title}</h4>

        <div className="ic-item__footer">
          <span className="ic-item__time">
            {item.timestamp.toLocaleString("ko-KR")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
