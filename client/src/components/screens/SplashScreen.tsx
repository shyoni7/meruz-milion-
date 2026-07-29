/**
 * HaMerutz L-70 — Splash Screen (מסך פתיחה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * The cinematic title card that opens the game.
 * Shows the "70" logo, title, and a dramatic start button.
 */

import { motion } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/logo-70-3mbXKeQKDaBD2zfByZ2EMA.webp";
const BG_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-hero-FcZMpxxMxUGKgQSbRFzK7s.webp";

interface SplashScreenProps {
  onStart: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div className="game-screen" dir="rtl">
      {/* Cinematic background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_HERO})` }}
      />
      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.3)] via-[oklch(0.13_0.03_250/0.5)] to-[oklch(0.13_0.03_250/0.97)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[oklch(0.13_0.03_250/0.6)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6 items-center justify-between py-16">
        {/* Top — show title */}
        <motion.div
          className="flex flex-col items-center gap-2 pt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-gold/70 text-xs tracking-[0.3em] uppercase font-medium">
            מוגש בגאווה לכבוד
          </p>
        </motion.div>

        {/* Center — logo + title */}
        <div className="flex flex-col items-center gap-6">
          {/* "70" Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="gold-glow rounded-full"
          >
            <img
              src={LOGO_URL}
              alt="70"
              className="w-36 h-36 object-contain"
            />
          </motion.div>

          {/* Title */}
          <motion.div
            className="text-center flex flex-col gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h1 className="font-display text-white text-5xl font-bold leading-none">
              המירוץ
            </h1>
            <div className="flex items-center gap-3 justify-center">
              <div className="gold-rule flex-1" />
              <span className="text-gold font-display text-2xl font-bold italic">ל־70</span>
              <div className="gold-rule flex-1" />
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              מסע מיוחד לכבוד יום הולדתו ה־70 של שלמה
            </p>
          </motion.div>
        </div>

        {/* Bottom — CTA */}
        <motion.div
          className="w-full flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <button className="btn-gold text-lg py-4" onClick={onStart}>
            🎬 התחילו את המסע
          </button>
          <p className="text-white/30 text-xs text-center">
            {new Date().getFullYear()} · יום הולדת שמח שלמה
          </p>
        </motion.div>
      </div>
    </div>
  );
}
