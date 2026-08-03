/**
 * HaMerutz L-70 — Splash Screen (מסך פתיחה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Welcome card styled after the approved reference design:
 * gold-framed card, welcome title, intro text, instruction rows
 * (photo per task + production approval), and a scratch-card CTA.
 */

import { motion } from "framer-motion";
import { Camera, CheckCircle2, ChevronsDown, Star } from "lucide-react";
import { useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/logo-70-3mbXKeQKDaBD2zfByZ2EMA.webp";
const BG_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-hero-FcZMpxxMxUGKgQSbRFzK7s.webp";

interface SplashScreenProps {
  onStart: () => void;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
});

export default function SplashScreen({ onStart }: SplashScreenProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="game-screen overflow-y-auto" dir="rtl">
      {/* Cinematic background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_HERO})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.55)] via-[oklch(0.13_0.03_250/0.75)] to-[oklch(0.13_0.03_250/0.97)]" />

      {/* Gold-framed card */}
      <div className="relative z-10 min-h-full flex items-stretch max-w-[480px] mx-auto w-full p-3">
        <div
          className="flex-1 rounded-2xl p-[2px] my-1 flex"
          style={{
            background:
              "linear-gradient(160deg, #e8c876 0%, #a07f2c 25%, #f0d080 50%, #8a6b20 75%, #e8c876 100%)",
            boxShadow: "0 0 40px oklch(0.72 0.12 75 / 0.25)",
          }}
        >
          <div className="flex-1 w-full rounded-[14px] bg-[oklch(0.14_0.035_255/0.96)] px-5 py-8 flex">
            <div className="m-auto w-full flex flex-col items-center gap-5">
            {/* Logo (falls back to a styled "70" badge if the image fails) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="gold-glow shrink-0"
            >
              {logoFailed ? (
                <div className="w-32 h-32 rounded-full border-2 border-gold/70 flex flex-col items-center justify-center">
                  <span className="text-gold text-xs font-bold tracking-widest">המירוץ</span>
                  <span className="text-gold text-5xl font-extrabold leading-none">70</span>
                </div>
              ) : (
                <img
                  src={LOGO_URL}
                  alt="המירוץ ל-70"
                  className="w-32 h-32 object-contain"
                  onError={() => setLogoFailed(true)}
                />
              )}
            </motion.div>

            {/* Welcome title */}
            <motion.div className="text-center shrink-0" {...fadeUp(0.35)}>
              <h1 className="text-white text-4xl font-extrabold leading-tight">
                ברוכים הבאים
              </h1>
              <h2 className="text-gold text-3xl font-extrabold leading-tight mt-1">
                למירוץ הגדול!
              </h2>
            </motion.div>

            {/* Star divider */}
            <motion.div className="flex items-center gap-3 w-full shrink-0" {...fadeUp(0.45)}>
              <div className="gold-rule flex-1" />
              <Star className="w-4 h-4 text-gold fill-current" />
              <div className="gold-rule flex-1" />
            </motion.div>

            {/* Intro text */}
            <motion.p
              className="text-white/90 text-lg leading-relaxed text-center font-medium shrink-0"
              {...fadeUp(0.55)}
            >
              השנה אנחנו לא רצים אחרי מיליון...
              <br />
              אנחנו רצים בעקבות
              <br />
              70 שנות חייו של <span className="text-gold font-bold">שלמה</span>.
            </motion.p>

            {/* Instruction rows */}
            <motion.div className="flex flex-col gap-4 w-full mt-1 shrink-0" {...fadeUp(0.7)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-gold/50 flex items-center justify-center shrink-0">
                  <Camera className="w-6 h-6 text-gold" />
                </div>
                <p className="text-white/85 text-base leading-snug">
                  לאחר כל משימה
                  <br />
                  צלמו ושלחו תמונה באפליקציה.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-gold/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-gold" />
                </div>
                <p className="text-white/85 text-base leading-snug">
                  רק לאחר אישור ההפקה
                  <br />
                  תוכלו להתקדם.
                </p>
              </div>
            </motion.div>

            {/* Ready? */}
            <motion.p
              className="text-gold text-3xl font-extrabold mt-2 shrink-0"
              {...fadeUp(0.85)}
            >
              מוכנים?
            </motion.p>

            {/* CTA */}
            <motion.div className="w-full flex flex-col items-center gap-2 shrink-0" {...fadeUp(0.95)}>
              <button
                className="w-full py-4 rounded-xl text-[#0a0f1e] text-lg font-bold border border-[#f0d080]/70"
                style={{
                  background:
                    "linear-gradient(180deg, #f0d080 0%, #d4af53 55%, #b8933a 100%)",
                  boxShadow: "0 4px 24px oklch(0.72 0.12 75 / 0.35)",
                }}
                onClick={onStart}
              >
                גרדו את הכרטיס הראשון!
              </button>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronsDown className="w-7 h-7 text-gold" />
              </motion.div>
            </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
