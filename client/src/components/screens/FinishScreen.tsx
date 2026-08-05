/**
 * HaMerutz L-70 — Finish Screen (סיום המירוץ)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Shown after all stations are completed: final rank + times,
 * a blessing form for the guest of honor, and the slideshow link.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useLocation } from "wouter";
import { useGame } from "@/contexts/GameContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/logo-70-3mbXKeQKDaBD2zfByZ2EMA.webp";
const BG_SUCCESS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663445418346/fThv242e3yexMmfJnHMtiQ/bg-success-iGeqHPygneH9kHBLgKfVBi.webp";

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FinishScreen() {
  const confettiFired = useRef(false);
  const [, setLocation] = useLocation();
  const { stations } = useGame();
  const [blessing, setBlessing] = useState("");
  const [blessingSent, setBlessingSent] = useState(false);

  const teamId = parseInt(localStorage.getItem("hamerutz_team_id") ?? "0", 10);

  const { data: stats } = trpc.game.getTeamStats.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const blessingMutation = trpc.game.addBlessing.useMutation({
    onSuccess: () => {
      setBlessingSent(true);
      toast.success("הברכה נשלחה! ❤️");
    },
    onError: () => toast.error("שגיאה בשליחת הברכה, נסו שוב"),
  });

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

  const stationName = (index: number) => stations[index]?.name ?? `תחנה ${index + 1}`;

  return (
    <div className="game-screen overflow-y-auto" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_SUCCESS})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.13_0.03_250/0.6)] to-[oklch(0.13_0.03_250/0.95)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-full max-w-[480px] mx-auto w-full px-6 items-center gap-6 py-10">
        {/* Logo */}
        <motion.img
          src={LOGO_URL}
          alt="70"
          className="w-24 h-24 object-contain shrink-0"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        />

        <motion.div
          className="text-center flex flex-col gap-3 shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="font-display text-gold text-4xl font-bold leading-tight">
            🎉 כל הכבוד!
          </h1>
          <p className="text-white text-xl font-semibold">
            השלמתם את המירוץ ל־70!
          </p>
        </motion.div>

        {/* Race stats */}
        {stats && (
          <motion.div
            className="glass-card p-5 w-full shrink-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">
              📊 הנתונים שלכם
            </p>
            <div className="flex flex-col gap-2">
              {stats.rank && (
                <div className="flex justify-between text-white/90">
                  <span>מקום במירוץ</span>
                  <span className="text-gold font-bold">
                    {stats.rank} מתוך {stats.totalTeams}
                  </span>
                </div>
              )}
              {stats.totalMs != null && (
                <div className="flex justify-between text-white/90">
                  <span>זמן כולל</span>
                  <span className="text-gold font-bold font-mono" dir="ltr">{formatMs(stats.totalMs)}</span>
                </div>
              )}
              {stats.stations
                .filter((st) => st.durationMs != null)
                .map((st) => (
                  <div key={st.stationIndex} className="flex justify-between text-white/60 text-sm">
                    <span>{stationName(st.stationIndex)}</span>
                    <span className="font-mono" dir="ltr">{formatMs(st.durationMs!)}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Blessing form */}
        <motion.div
          className="glass-card p-5 w-full shrink-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {blessingSent ? (
            <p className="text-gold text-center font-bold text-lg">
              ❤️ הברכה שלכם נשלחה ותוצג במצגת!
            </p>
          ) : (
            <>
              <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">
                💌 כתבו ברכה לשלמה
              </p>
              <textarea
                value={blessing}
                onChange={(e) => setBlessing(e.target.value)}
                placeholder="מילים חמות ליום ההולדת..."
                maxLength={1000}
                className="w-full min-h-[90px] rounded-xl bg-[oklch(0.1_0.03_250/0.8)] border border-[#c9a84c]/40 text-white text-base p-3 focus:outline-none focus:border-[#c9a84c] resize-y"
              />
              <button
                className="btn-gold w-full mt-3"
                onClick={() => blessingMutation.mutate({ teamId, text: blessing })}
                disabled={blessingMutation.isPending || blessing.trim().length < 2}
              >
                {blessingMutation.isPending ? "שולח..." : "שלחו את הברכה ❤️"}
              </button>
            </>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          onClick={() => setLocation("/slideshow")}
          className="w-full py-4 rounded-2xl bg-[#c9a84c] text-[#0a0f1e] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#d4b55a] active:scale-[0.97] transition-all shadow-lg shadow-[#c9a84c]/30 shrink-0"
        >
          🎬 צפו במצגת כל המשתתפים
        </motion.button>

        <p className="text-white/50 text-sm text-center shrink-0">
          70 שנים של חיים מדהימים. יום הולדת שמח, שלמה! ❤️
        </p>
      </div>
    </div>
  );
}
