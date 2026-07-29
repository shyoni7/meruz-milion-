/**
 * HaMerutz L-70 — Clue Screen (מסך רמז)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Full-viewport screen with:
 * - Cinematic background image (or gradient placeholder)
 * - Station badge (number)
 * - Title (Playfair Display)
 * - Clue text
 * - "המשך" button
 */

import { motion } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { stations } from "@/data/stations";

// Background image URLs — replace with real images when approved
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/logo-70-3mbXKeQKDaBD2zfByZ2EMA.webp";
const BG_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-clue-BYCaNVLk5NvLDjGuHwcxEn.webp";

export default function ClueScreen() {
  const { currentStation, advanceScreen } = useGame();

  return (
    <div className="game-screen" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_HERO})` }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.4)] via-[oklch(0.13_0.03_250/0.6)] to-[oklch(0.13_0.03_250/0.95)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <div className="station-badge">{currentStation.number}</div>
          <div className="text-right">
            <p className="text-[oklch(0.72_0.12_75/0.7)] text-xs font-medium tracking-widest uppercase">
              המירוץ ל־70
            </p>
          </div>
        </div>

        {/* Logo */}
        <motion.div
          className="flex justify-center mb-2"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <img src={LOGO_URL} alt="70" className="w-16 h-16 object-contain opacity-80" />
        </motion.div>

        <div className="gold-rule mb-8" />

        {/* Main content — centered vertically */}
        <div className="flex-1 flex flex-col justify-center gap-6">
          {/* Clue label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="text-gold text-xs font-semibold tracking-[0.2em] uppercase">
              📍 הרמז שלכם
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-display text-white text-3xl font-bold leading-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {currentStation.clue.title}
          </motion.h1>

          {/* Clue text */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p className="text-white/90 text-lg leading-relaxed">
              {currentStation.clue.text}
            </p>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="pb-10 pt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <button className="btn-gold" onClick={advanceScreen}>
            המשך →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
