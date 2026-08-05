/**
 * HaMerutz L-70 — Task Complete Screen (משימה הושלמה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Celebratory screen with:
 * - APPROVED stamp
 * - Canvas confetti (gold + white)
 * - Gold pulse animation
 * - Fun fact about Shlomo
 * - "המשך למשימה הבאה" button
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGame } from "@/contexts/GameContext";
import { trpc } from "@/lib/trpc";

const BG_SUCCESS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-success-iGeqHPygneH9kHBLgKfVBi.webp";

export default function TaskComplete() {
  const { currentStation, nextStation, state, stations } = useGame();
  const confettiFired = useRef(false);
  const isLastStation = state.currentStationIndex === stations.length - 1;
  const teamId = parseInt(localStorage.getItem("hamerutz_team_id") ?? "0", 10);
  const { data: stats } = trpc.game.getTeamStats.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    // Gold confetti burst
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55, colors: ["#c9a84c", "#f0d080"] });
    fire(0.2, { spread: 60, colors: ["#ffffff", "#c9a84c"] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#c9a84c", "#f0d080", "#ffffff"] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#c9a84c"] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ["#ffffff", "#f0d080"] });
  }, []);

  return (
    <div className="game-screen" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_SUCCESS})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.5)] via-[oklch(0.13_0.03_250/0.6)] to-[oklch(0.13_0.03_250/0.98)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <div className="station-badge">{currentStation.number}</div>
          <p className="text-gold/60 text-xs tracking-widest uppercase">הצלחה!</p>
        </div>

        <div className="gold-rule mb-8" />

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          {/* APPROVED stamp */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="approved-stamp">APPROVED</div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-display text-white text-3xl font-bold text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            ✅ המשימה הושלמה!
          </motion.h1>

          {/* Fun fact */}
          <motion.div
            className="glass-card p-5 animate-gold-pulse w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
              ✨ ידעתם?
            </p>
            <p className="text-white/90 text-base leading-relaxed">
              {currentStation.fact}
            </p>
          </motion.div>

          {/* Live standing */}
          {stats?.rank && stats.totalTeams > 1 && (
            <motion.div
              className="glass-card p-4 w-full text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.75 }}
            >
              <p className="text-white/90 text-lg font-bold">
                🏁 אתם במקום ה-{stats.rank} מתוך {stats.totalTeams} קבוצות!
              </p>
            </motion.div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          className="pb-10 pt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <button className="btn-gold" onClick={nextStation}>
            {isLastStation ? "🎉 סיימנו! לסיום" : "המשך למשימה הבאה →"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
