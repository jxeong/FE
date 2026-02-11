import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function InsightCartLoading({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ic-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "linear",
            }}
          >
            <Sparkles className="ic-loading__icon" />
          </motion.div>

          <p className="ic-loading__text">엑셀 파일로 내보내기 중…</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
