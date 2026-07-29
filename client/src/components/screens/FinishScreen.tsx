/**
 * HaMerutz L-70 — Finish Screen (סיום המירוץ)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Shown after all stations are completed.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/logo-70-3mbXKeQKDaBD2zfByZ2EMA.webp";
const BG_SUCCESS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-success-iGeqHPygneH9kHBLgKfVBi.webp";

export default function FinishScreen() {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#c9a84c", "#f0d080", "#ffffff"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#c9a84c", "#f0d080", "#ffffff"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="game-screen" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_SUCCESS})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.6)] to-[oklch(0.13_0.03_250/0.95)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6 items-center justify-center gap-8">
        {/* Logo */}
        <motion.img
          src={LOGO_URL}
          alt="70"
          className="w-28 h-28 object-contain"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        />

        <motion.div
          className="text-center flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h1 className="font-display text-gold text-4xl font-bold leading-tight">
            🎉 כל הכבוד!
          </h1>
          <p className="text-white text-xl font-semibold">
            השלמתם את המירוץ ל־70!
          </p>
          <p className="text-white/60 text-base leading-relaxed">
            70 שנים של חיים מדהימים.
            <br />
            יום הולדת שמח, שלמה!
          </p>
        </motion.div>

        <motion.div
          className="glass-card p-5 text-center w-full animate-gold-pulse"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-gold font-display text-2xl font-bold">
            ❤️ אוהבים אותך
          </p>
        </motion.div>
      </div>
    </div>
  );
}

