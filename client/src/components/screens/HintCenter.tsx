/**
 * HaMerutz L-70 — Hint Center (מרכז הרמזים)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Modal overlay that reveals hints one by one.
 * Triggered by "💡 צריכים עזרה?" button.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useGame } from "@/contexts/GameContext";

interface HintCenterProps {
  onClose: () => void;
}

export default function HintCenter({ onClose }: HintCenterProps) {
  const { currentStation, state, revealHint } = useGame();
  const { hints } = currentStation;
  const { hintsRevealed } = state;
  const allRevealed = hintsRevealed >= hints.length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ direction: "rtl" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[oklch(0.05_0.02_250/0.85)] backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative z-10 w-full max-w-[480px] glass-card rounded-b-none rounded-t-2xl p-6 pb-10"
          style={{ background: "oklch(0.16 0.025 250 / 0.97)" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gold font-display text-xl font-bold">
              💡 מרכז הרמזים
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
              style={{ background: "oklch(1 0 0 / 0.08)" }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="gold-rule mb-5" />

          {/* Revealed hints */}
          <div className="flex flex-col gap-3 mb-5">
            {hints.slice(0, hintsRevealed).map((hint, i) => (
              <motion.div
                key={i}
                className="glass-card p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-gold text-sm font-bold mt-0.5 flex-shrink-0">
                    רמז {i + 1}
                  </span>
                  <p className="text-white/90 text-sm leading-relaxed">{hint}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action */}
          {allRevealed ? (
            <div className="glass-card p-4 text-center">
              <p className="text-white/60 text-sm">זהו הרמז האחרון.</p>
            </div>
          ) : (
            <button className="btn-gold" onClick={revealHint}>
              {hintsRevealed === 0 ? "קבלו רמז ראשון" : "רמז נוסף"}
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
