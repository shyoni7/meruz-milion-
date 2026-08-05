/**
 * EnvelopeReveal — an envelope sealed with adhesive tape.
 * Drag a finger across the tape to tear it; the flap opens and the clue
 * is revealed, then onRevealed() is called.
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface EnvelopeRevealProps {
  stationNumber: number;
  onRevealed: () => void;
}

export default function EnvelopeReveal({ stationNumber, onRevealed }: EnvelopeRevealProps) {
  const [progress, setProgress] = useState(0); // 0..1 tear progress
  const [torn, setTorn] = useState(false);
  const [opened, setOpened] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const tapeRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  const finishTear = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTorn(true);
    // Open the flap shortly after the tape flies off, then reveal
    setTimeout(() => setOpened(true), 350);
    setTimeout(onRevealed, 1400);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (torn) return;
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || torn) return;
    const width = tapeRef.current?.offsetWidth ?? 280;
    const p = Math.min(1, Math.abs(e.clientX - startX.current) / (width * 0.75));
    setProgress(p);
    if (p >= 1) {
      dragging.current = false;
      finishTear();
    }
  };

  const onPointerUp = () => {
    dragging.current = false;
    if (!torn && progress < 1) setProgress(0); // snap back if not torn
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 select-none" dir="rtl">
      {/* Envelope */}
      <div className="relative w-full max-w-[340px] aspect-[4/3]">
        {/* Body */}
        <div
          className="absolute inset-0 rounded-xl border border-[#c9a84c]/50"
          style={{
            background: "linear-gradient(160deg, #f6ead0 0%, #eddcb4 55%, #e3cd9c 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
          }}
        >
          {/* Inner card peeking out when opened */}
          <motion.div
            className="absolute left-4 right-4 top-3 bottom-10 rounded-lg bg-[#0d1526] border border-[#c9a84c]/40 flex items-center justify-center"
            initial={false}
            animate={opened ? { y: -18, opacity: 1 } : { y: 8, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="text-center px-4">
              <p className="text-gold/70 text-xs tracking-widest mb-1">תחנה {stationNumber}</p>
              <p className="text-gold font-bold text-xl">הרמז נחשף! ✉️</p>
            </div>
          </motion.div>

          {/* Flap (triangle) */}
          <motion.div
            className="absolute inset-x-0 top-0 origin-top"
            style={{ height: "52%", perspective: 600 }}
            initial={false}
            animate={opened ? { rotateX: 170, opacity: 0.85 } : { rotateX: 0 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="w-full h-full"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                background: "linear-gradient(180deg, #efe0bd 0%, #e0cb90 100%)",
                borderBottom: "1px solid rgba(160,127,44,0.35)",
              }}
            />
          </motion.div>

          {/* Wax-style station badge */}
          {!opened && (
            <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#a8352f] border-2 border-[#7e241f] flex items-center justify-center text-white font-bold shadow-lg">
              {stationNumber}
            </div>
          )}
        </div>

        {/* Adhesive tape strip */}
        {!torn && (
          <div
            ref={tapeRef}
            className="absolute left-[-12px] right-[-12px] top-[38%] h-12 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              transform: `translateX(${progress * -110}%) rotate(${-4 - progress * 10}deg)`,
              opacity: 1 - progress * 0.35,
              transition: dragging.current ? "none" : "transform 0.25s ease, opacity 0.25s ease",
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.85) 0 12px, rgba(235,235,235,0.85) 12px 24px)",
                border: "1px dashed rgba(120,120,120,0.5)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              }}
            >
              <span className="text-[#5a4a1e] text-sm font-bold tracking-wide">
                ✂️ משכו כדי לתלוש את הסרט
              </span>
            </div>
          </div>
        )}

        {/* Torn tape flying away */}
        {torn && !opened && (
          <motion.div
            className="absolute left-[-12px] right-[-12px] top-[38%] h-12 pointer-events-none"
            initial={{ x: "-40%", rotate: -12, opacity: 0.9 }}
            animate={{ x: "-160%", rotate: -35, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeIn" }}
          >
            <div
              className="w-full h-full rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.85) 0 12px, rgba(235,235,235,0.85) 12px 24px)",
              }}
            />
          </motion.div>
        )}
      </div>

      <p className="text-white/50 text-sm text-center">
        {torn ? "פותחים את המעטפה..." : "החליקו את האצבע לאורך הסרט הדביק"}
      </p>
    </div>
  );
}
