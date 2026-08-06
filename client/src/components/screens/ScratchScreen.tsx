/**
 * HaMerutz L-70 — Scratch Screen (מסך כרטיס גירוד)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Shown before each station's clue.
 * The player scratches the card to reveal the clue text,
 * then is automatically advanced to the ClueScreen.
 */

import { motion } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import EnvelopeReveal from "@/components/EnvelopeReveal";

const BG_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-hero-FcZMpxxMxUGKgQSbRFzK7s.webp";

export default function ScratchScreen() {
  const { currentStation, scratchRevealed } = useGame();

  return (
    <div className="game-screen" dir="rtl">
      {/* Cinematic background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_HERO})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.6)] via-[oklch(0.13_0.03_250/0.7)] to-[oklch(0.13_0.03_250/0.97)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <div className="station-badge">{currentStation.number}</div>
          <div className="text-right">
            <p className="text-gold/70 text-xs font-medium tracking-widest uppercase">
              המירוץ ל־70
            </p>
          </div>
        </div>

        {/* Gold rule */}
        <div className="gold-rule mb-8" />

        {/* Heading */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="font-display text-white text-3xl font-bold mb-2">
            {currentStation.name}
          </h2>
          <p className="text-white/50 text-sm">
            תלשו את פס הזהב ומשכו את הכרטיס מהמעטפה כדי לגלות את הרמז
          </p>
        </motion.div>

        {/* Sealed envelope */}
        <motion.div
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EnvelopeReveal
            stationNumber={currentStation.number}
            onRevealed={scratchRevealed}
          />
        </motion.div>

        {/* Bottom spacer */}
        <div className="pb-8" />
      </div>
    </div>
  );
}
