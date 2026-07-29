/**
 * HaMerutz L-70 — Control Room (חדר הבקרה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Shown after the team sends their photo.
 * They wait for WhatsApp confirmation, then choose:
 * ✅ Mission approved
 * ❌ Try again
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import HintCenter from "./HintCenter";

export default function ControlRoom() {
  const { currentStation, approveMission, retryMission } = useGame();
  const [showHints, setShowHints] = useState(false);

  return (
    <>
      <div className="game-screen" dir="rtl">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-[oklch(0.13_0.03_250)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 80%, oklch(0.72 0.12 75 / 0.3), transparent)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-12 pb-6">
            <div className="station-badge">{currentStation.number}</div>
            <p className="text-gold/60 text-xs tracking-widest uppercase">חדר הבקרה</p>
          </div>

          <div className="gold-rule mb-8" />

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center gap-6">
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
                  background: "oklch(0.72 0.12 75 / 0.1)",
                  border: "1px solid oklch(0.72 0.12 75 / 0.3)",
                }}
              >
                📡
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-display text-white text-3xl font-bold text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              חדר הבקרה
            </motion.h1>

            {/* Instructions */}
            <motion.div
              className="glass-card p-5 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <p className="text-white/90 text-base leading-relaxed mb-2">
                התמונה נשלחה לצוות ההפקה.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                המתינו לקבלת תשובה ב-WhatsApp.
                <br />
                לאחר קבלת תשובה, בחרו את האפשרות המתאימה.
              </p>
            </motion.div>
          </div>

          {/* Action buttons */}
          <motion.div
            className="flex flex-col gap-3 pb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <button
              className="btn-gold flex items-center justify-center gap-2"
              onClick={approveMission}
            >
              🟢 המשימה אושרה
            </button>

            <button
              className="btn-outline-gold flex items-center justify-center gap-2"
              style={{ color: "oklch(0.7 0.2 25)", borderColor: "oklch(0.7 0.2 25 / 0.3)" }}
              onClick={retryMission}
            >
              🔴 התבקשנו לנסות שוב
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
