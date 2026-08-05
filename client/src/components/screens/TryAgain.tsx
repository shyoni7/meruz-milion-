/**
 * HaMerutz L-70 — Try Again Screen (נסו שוב)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Shown when the mission is rejected.
 * Options: retake photo → back to ControlRoom, or get help.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Lightbulb } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import HintCenter from "./HintCenter";

export default function TryAgain() {
  const { currentStation, retryPhoto } = useGame();
  const [showHints, setShowHints] = useState(false);
  // Note the production team attached to the rejection (set by ControlRoom)
  const adminNote = localStorage.getItem("hamerutz_last_note");

  return (
    <>
      <div className="game-screen overflow-y-auto" dir="rtl">
        {/* Background */}
        <div className="absolute inset-0 bg-[oklch(0.13_0.03_250)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 80%, oklch(0.6 0.2 25 / 0.3), transparent)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-full max-w-[480px] mx-auto w-full px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-12 pb-6">
            <div className="station-badge">{currentStation.number}</div>
            <p className="text-[oklch(0.7_0.2_25)] text-xs tracking-widest uppercase">נסו שוב</p>
          </div>

          <div className="gold-rule mb-8" />

          {/* Main content */}
          <div className="flex flex-col gap-6 my-auto py-2">
            {/* Icon */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{
                  background: "oklch(0.6 0.2 25 / 0.1)",
                  border: "1px solid oklch(0.6 0.2 25 / 0.3)",
                }}
              >
                ❌
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-display text-white text-3xl font-bold text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              כמעט...
            </motion.h1>

            {/* Instructions */}
            <motion.div
              className="glass-card p-5 text-center"
              style={{ borderColor: "oklch(0.6 0.2 25 / 0.2)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <p className="text-white/90 text-base leading-relaxed mb-2">
                המשימה עדיין לא אושרה.
              </p>
              {adminNote ? (
                <p className="text-gold text-base leading-relaxed font-medium">
                  💬 הודעה מההפקה: {adminNote}
                </p>
              ) : (
                <p className="text-white/60 text-sm leading-relaxed">
                  בדקו שוב את ההוראות.
                  <br />
                  צלמו תמונה חדשה ושלחו אותה שוב.
                </p>
              )}
            </motion.div>
          </div>

          {/* Action buttons */}
          <motion.div
            className="flex flex-col gap-3 pb-10 pt-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <button
              className="btn-gold flex items-center justify-center gap-2"
              onClick={retryPhoto}
            >
              <Camera size={16} />
              שלח תמונה חדשה
            </button>

            <button
              className="btn-outline-gold flex items-center justify-center gap-2"
              onClick={() => setShowHints(true)}
            >
              <Lightbulb size={16} />
              צריכים עזרה?
            </button>
          </motion.div>
        </div>
      </div>

      {showHints && <HintCenter onClose={() => setShowHints(false)} />}
    </>
  );
}
