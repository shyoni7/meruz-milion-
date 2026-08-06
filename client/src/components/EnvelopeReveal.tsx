/**
 * EnvelopeReveal — an envelope sealed with a gold tear strip.
 * Two-step reveal (game-manager's animation): drag along the strip to tear
 * it (gold paper particles fly), the flap swings open, then pull the card
 * up out of the envelope to reveal the clue and trigger onRevealed().
 */

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createTearSound } from "@/lib/tearSound";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const PULL_DISTANCE = 260;

type Phase = "sealed" | "opening" | "ready" | "revealed";
type Particle = { id: number; x: number; y: number; dx: number; dy: number; r: number; s: number };

interface EnvelopeRevealProps {
  stationNumber: number;
  onRevealed: () => void;
  dir?: "rtl" | "ltr";
  tearHint?: string;
  pullHint?: string;
}

export default function EnvelopeReveal({
  stationNumber,
  onRevealed,
  dir = "rtl",
  tearHint = "משכו לתלישה",
  pullHint = "משכו את הכרטיס מעלה",
}: EnvelopeRevealProps) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [contentVisible, setContentVisible] = useState(false);

  const tear = useMotionValue(0); // 0 → 1 strip torn
  const pull = useMotionValue(0); // 0 → 1 card extracted

  const stripRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ origin: number; width: number } | null>(null);
  const pullState = useRef<{ origin: number } | null>(null);
  const particleId = useRef(0);
  const soundRef = useRef<ReturnType<typeof createTearSound> | null>(null);

  const getSound = () => {
    if (!soundRef.current) soundRef.current = createTearSound();
    return soundRef.current;
  };

  // Silence the tear loop if the component unmounts mid-drag
  useEffect(() => () => soundRef.current?.stop(), []);

  /* ---- gold paper particles ---- */
  const spawnParticles = useCallback(
    (progress: number) => {
      const burst = Array.from({ length: 3 }, () => ({
        id: (particleId.current += 1),
        x: dir === "rtl" ? 100 - progress * 100 : progress * 100,
        y: 50 + (Math.random() * 40 - 20),
        dx: (Math.random() * 2 - 1) * 40,
        dy: 20 + Math.random() * 60,
        r: Math.random() * 220 - 110,
        s: 0.5 + Math.random() * 0.9,
      }));
      setParticles((prev) => [...prev.slice(-18), ...burst]);
    },
    [dir],
  );

  /* ---- horizontal tear ---- */
  const finishTear = useCallback(() => {
    navigator.vibrate?.([18, 40, 26]);
    const sound = getSound();
    sound.stop();
    window.setTimeout(() => sound.thud(), 250); // in time with the flap swing
    animate(tear, 1, { type: "spring", stiffness: 90, damping: 18 });
    setPhase("opening");
    window.setTimeout(() => setPhase((p) => (p === "opening" ? "ready" : p)), 1500);
  }, [tear]);

  const onStripDown = (e: React.PointerEvent) => {
    if (phase !== "sealed") return;
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragState.current = { origin: e.clientX, width: rect.width };
    const sound = getSound();
    sound.start();
    sound.setIntensity(0.15);
  };

  const onStripMove = (e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s || phase !== "sealed") return;
    const delta = dir === "rtl" ? s.origin - e.clientX : e.clientX - s.origin;
    const progress = clamp01(delta / (s.width * 0.82));
    if (progress > tear.get() + 0.05) spawnParticles(progress);
    getSound().setIntensity(0.15 + progress * 0.85);
    tear.set(progress);
    if (progress >= 0.99) {
      dragState.current = null;
      finishTear();
    }
  };

  const onStripUp = () => {
    if (!dragState.current || phase !== "sealed") return;
    dragState.current = null;
    if (tear.get() > 0.55) finishTear();
    else {
      soundRef.current?.stop();
      animate(tear, 0, { type: "spring", stiffness: 120, damping: 20 });
    }
  };

  /* ---- vertical card pull ---- */
  const onCardDown = (e: React.PointerEvent) => {
    if (phase !== "ready") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pullState.current = { origin: e.clientY };
  };

  const onCardMove = (e: React.PointerEvent) => {
    if (!pullState.current || phase !== "ready") return;
    const progress = clamp01((pullState.current.origin - e.clientY) / PULL_DISTANCE);
    pull.set(Math.max(pull.get() * 0.35, progress)); // ratchet: never snaps back mid-drag
  };

  const completePull = useCallback(() => {
    animate(pull, 1, { type: "spring", stiffness: 60, damping: 20, mass: 1.1 });
    setPhase("revealed");
    navigator.vibrate?.(12);
    window.setTimeout(onRevealed, 900); // let the card finish sliding out
  }, [onRevealed, pull]);

  const onCardUp = () => {
    if (!pullState.current || phase !== "ready") return;
    pullState.current = null;
    if (pull.get() > 0.45) completePull();
    else animate(pull, 0.3, { type: "spring", stiffness: 70, damping: 18 }); // rest at a peek
  };

  useMotionValueEvent(pull, "change", (v) => {
    if (v > 0.82) setContentVisible(true);
  });
  useEffect(() => {
    if (phase === "ready") animate(pull, 0.3, { type: "spring", stiffness: 60, damping: 20 });
  }, [phase, pull]);

  /* ---- derived transforms ---- */
  const intactClip = useTransform(tear, (t) =>
    dir === "rtl" ? `inset(0 ${t * 100}% 0 0)` : `inset(0 0 0 ${t * 100}%)`,
  );
  const stripPieceX = useTransform(tear, [0, 1], dir === "rtl" ? [0, -190] : [0, 190]);
  const stripPieceRotate = useTransform(tear, [0, 0.4, 1], [0, dir === "rtl" ? -9 : 9, dir === "rtl" ? -26 : 26]);
  const stripPieceOpacity = useTransform(tear, [0, 0.85, 1], [1, 1, 0]);
  const stripPieceSkew = useTransform(tear, [0, 0.5, 1], [0, 6, 2]);
  const hintTextOpacity = useTransform(tear, [0, 0.25], [1, 0]);

  const cardY = useTransform(pull, [0, 1], [10, -290]);
  const cardScale = useTransform(pull, [0, 1], [0.94, 1]);
  const glowOpacity = useTransform(pull, [0, 0.4, 1], [0, 0.5, 0.9]);
  const hintOpacity = useTransform(pull, [0, 0.35], [1, 0]);

  const flapOpen = phase !== "sealed";

  const gradientGold = "linear-gradient(135deg, var(--gold-light), var(--gold))";
  const glowGold = "0 0 18px oklch(0.72 0.12 75 / 0.5)";

  const caption =
    phase === "sealed"
      ? "החליקו אצבע לאורך פס הזהב"
      : phase === "opening"
        ? "המעטפה נפתחת..."
        : phase === "ready"
          ? "משכו את הכרטיס החוצה"
          : "הרמז נחשף!";

  return (
    <div className="w-full flex flex-col items-center gap-4 select-none" dir={dir}>
      <div className="relative w-full max-w-[340px] h-[500px]" style={{ perspective: 900 }}>
        {/* glow that intensifies as the card emerges */}
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute left-1/2 top-4 h-64 w-[85%] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
        />

        {/* envelope inside (behind the card) */}
        <div className="absolute inset-x-0 bottom-0 h-[220px] rounded-xl bg-[#0b1322] border border-[#c9a84c]/30" />

        {/* card riding the pull value */}
        <motion.div
          style={{ y: cardY, scale: cardScale }}
          onPointerDown={onCardDown}
          onPointerMove={onCardMove}
          onPointerUp={onCardUp}
          onPointerCancel={onCardUp}
          className={cn(
            "absolute inset-x-6 top-[300px] z-10 h-[190px] select-none rounded-2xl bg-[#0d1526] border border-[#c9a84c]/40 shadow-[0_10px_40px_rgba(0,0,0,0.45)] flex items-center justify-center",
            phase === "ready" ? "cursor-grab touch-none" : "",
          )}
        >
          {contentVisible ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.15 }}
              className="text-center px-4"
            >
              <p className="text-gold/70 text-xs tracking-widest mb-1">תחנה {stationNumber}</p>
              <p className="text-gold font-bold text-xl">הרמז נחשף! ✉️</p>
            </motion.div>
          ) : null}
        </motion.div>

        {/* envelope front pocket (in front of the card) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[220px] z-20 rounded-b-xl rounded-t-sm border border-[#c9a84c]/50 flex items-center justify-center"
          style={{
            background: "linear-gradient(160deg, #f6ead0 0%, #eddcb4 55%, #e3cd9c 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 6px 8px -6px rgba(0,0,0,0.4)",
          }}
        >
          {/* wax-style station badge */}
          <div className="w-12 h-12 rounded-full bg-[#a8352f] border-2 border-[#7e241f] flex items-center justify-center text-white font-bold shadow-lg">
            {stationNumber}
          </div>
        </div>

        {/* flap swings past 180° for depth, then drops behind the card */}
        <motion.div
          animate={{ rotateX: flapOpen ? -172 : 0 }}
          transition={{ type: "spring", stiffness: 26, damping: 14, mass: 1.4, delay: flapOpen ? 0.25 : 0 }}
          style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
          className={cn(
            "absolute inset-x-2 top-[280px] h-[130px]",
            phase === "ready" || phase === "revealed" ? "z-0" : "z-30",
          )}
        >
          {/* flap face */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: "linear-gradient(180deg, #efe0bd 0%, #e0cb90 100%)",
              borderBottom: "1px solid rgba(160,127,44,0.35)",
            }}
          />

          <div
            ref={stripRef}
            onPointerDown={onStripDown}
            onPointerMove={onStripMove}
            onPointerUp={onStripUp}
            onPointerCancel={onStripUp}
            className={cn(
              "absolute inset-x-3 top-3 h-9 touch-none select-none",
              phase === "sealed" ? "cursor-grab" : "pointer-events-none",
            )}
          >
            {/* intact strip, clipped away as you tear */}
            <motion.div
              style={{ clipPath: intactClip }}
              className="absolute inset-0 flex items-center justify-center rounded-full"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: gradientGold, boxShadow: glowGold }}
              />
              <motion.span
                style={{ opacity: hintTextOpacity }}
                className="relative text-xs font-bold tracking-[0.2em] text-primary-foreground"
              >
                ✂️ {tearHint}
              </motion.span>
            </motion.div>

            {/* torn piece bending after the finger */}
            <motion.div
              aria-hidden
              style={{
                x: stripPieceX,
                rotate: stripPieceRotate,
                skewY: stripPieceSkew,
                opacity: stripPieceOpacity,
                transformOrigin: dir === "rtl" ? "right center" : "left center",
              }}
              className={cn("absolute top-0 h-9 w-24 rounded-full", dir === "rtl" ? "right-0" : "left-0")}
            >
              <div className="h-full w-full rounded-full opacity-90" style={{ background: gradientGold }} />
            </motion.div>
          </div>

          {/* paper particles */}
          <div aria-hidden className="pointer-events-none absolute inset-x-3 top-3 h-9 overflow-visible">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0.9, x: 0, y: 0, rotate: 0, scale: p.s }}
                animate={{ opacity: 0, x: p.dx, y: p.dy, rotate: p.r }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute h-1 w-1.5 rounded-[1px] bg-gold-light"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            ))}
          </div>
        </motion.div>

        {/* grab-anywhere surface for the card pull (the peeking card alone is too small a target) */}
        {phase === "ready" ? (
          <div
            className="absolute inset-0 z-40 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={onCardDown}
            onPointerMove={onCardMove}
            onPointerUp={onCardUp}
            onPointerCancel={onCardUp}
          />
        ) : null}

        {/* floating pull hint */}
        {phase === "ready" ? (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute inset-x-0 bottom-3 z-[45] text-center text-xs font-bold tracking-[0.2em] text-[#5a4a1e]/80"
          >
            <motion.span
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              ↑ {pullHint}
            </motion.span>
          </motion.div>
        ) : null}
      </div>

      <p className="text-white/50 text-sm text-center">{caption}</p>
    </div>
  );
}
