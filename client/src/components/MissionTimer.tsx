/**
 * MissionTimer — small floating badge showing elapsed time on the current
 * station. startedAt comes from the server so refreshes don't reset it.
 */

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function format(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function MissionTimer({ startedAt }: { startedAt: Date | string }) {
  const startMs = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="fixed top-3 left-3 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-[#c9a84c]/40 bg-[oklch(0.13_0.03_250/0.85)] backdrop-blur-sm"
      dir="ltr"
    >
      <Timer className="w-3.5 h-3.5 text-gold" />
      <span className="text-gold font-mono text-sm font-bold tabular-nums">
        {format(now - startMs)}
      </span>
    </div>
  );
}
