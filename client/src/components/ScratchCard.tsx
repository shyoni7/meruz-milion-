/**
 * HaMerutz L-70 — ScratchCard Component
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * An interactive scratch card that reveals the clue beneath.
 * Uses HTML Canvas with pointer events for the scratch mechanic.
 *
 * - The "silver" layer is a metallic gold/silver gradient drawn on canvas
 * - Scratching erases the canvas layer (destination-out composite)
 * - When >60% is scratched, auto-reveals and calls onRevealed()
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScratchAudio } from "@/hooks/useScratchAudio";

interface ScratchCardProps {
  /** Text to reveal beneath the scratch layer */
  revealText: string;
  /** Station number for display */
  stationNumber: number;
  /** Called when card is fully revealed */
  onRevealed: () => void;
}

const SCRATCH_RADIUS = 60;
const REVEAL_THRESHOLD = 0.45; // 45% scratched = auto-reveal (faster)

export default function ScratchCard({ revealText, stationNumber, onRevealed }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const revealedRef = useRef(false);
  const { playScratch, playSuccess } = useScratchAudio();

  // Draw the metallic scratch layer on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Metallic gold/silver gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0,   "#b8922a");
    grad.addColorStop(0.2, "#e8c84a");
    grad.addColorStop(0.4, "#f5e070");
    grad.addColorStop(0.6, "#c9a227");
    grad.addColorStop(0.8, "#e8c84a");
    grad.addColorStop(1,   "#9a7a1e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle noise texture via small random dots
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // "גרדו כאן" instruction text
    ctx.fillStyle = "rgba(10, 20, 50, 0.7)";
    ctx.font = "bold 22px 'Heebo', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🪙 גרדו כאן לגלות את הרמז", canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = "16px 'Heebo', sans-serif";
    ctx.fillStyle = "rgba(10, 20, 50, 0.5)";
    ctx.fillText("הניחו אצבע וגררו", canvas.width / 2, canvas.height / 2 + 16);
  }, []);

  // Calculate how much has been scratched
  const calcScratchPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }
    return transparent / (canvas.width * canvas.height);
  }, []);

  // Scratch at a given canvas coordinate
  const scratch = useCallback((x: number, y: number) => {
    if (revealedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Play scratch sound on every drag move
    playScratch();

    // Sample every few moves to avoid perf hit
    const pct = calcScratchPercent();
    setScratchPercent(pct);

    if (pct >= REVEAL_THRESHOLD && !revealedRef.current) {
      revealedRef.current = true;
      setIsRevealed(true);
      // Play success fanfare immediately on reveal
      playSuccess();
      // Clear canvas fully for clean reveal
      const c = canvasRef.current;
      if (c) {
        const cx = c.getContext("2d");
        if (cx) cx.clearRect(0, 0, c.width, c.height);
      }
      setTimeout(onRevealed, 1200);
    }
  }, [calcScratchPercent, onRevealed, playScratch, playSuccess]);

  // Convert client coords → canvas coords
  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Pointer events
  const onPointerDown = (e: React.PointerEvent) => {
    setIsScratching(true);
    setHasStarted(true);
    const pos = getCanvasPos(e.clientX, e.clientY);
    scratch(pos.x, pos.y);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isScratching) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    scratch(pos.x, pos.y);
  };
  const onPointerUp = () => setIsScratching(false);

  // Touch events (prevent scroll while scratching)
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    setHasStarted(true);
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    scratch(pos.x, pos.y);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isScratching) return;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    scratch(pos.x, pos.y);
  };
  const onTouchEnd = () => setIsScratching(false);

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* Station badge */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="station-badge">{stationNumber}</div>
        <span className="text-gold/70 text-xs tracking-widest uppercase font-medium">
          גרדו לגלות את הרמז
        </span>
      </motion.div>

      {/* Card wrapper */}
      <motion.div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ aspectRatio: "3/2" }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Revealed layer (beneath canvas) */}
        <div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{
            background: "linear-gradient(135deg, oklch(0.17 0.04 250) 0%, oklch(0.22 0.05 250) 100%)",
            border: "1px solid oklch(0.72 0.12 75 / 0.3)",
          }}
        >
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="text-gold text-2xl mb-2">✨</div>
                <p className="text-white font-display text-lg font-semibold leading-snug" dir="rtl">
                  {revealText}
                </p>
              </motion.div>
            )}
            {!isRevealed && (
              <motion.div
                className="text-center opacity-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
              >
                <div className="text-gold text-4xl">🔒</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scratch canvas (on top) */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="absolute inset-0 w-full h-full touch-none"
          style={{
            cursor: isRevealed ? "default" : isScratching ? "crosshair" : "pointer",
            transition: "opacity 0.4s ease",
            opacity: isRevealed ? 0 : 1,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Gold border glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "inset 0 0 0 1.5px oklch(0.72 0.12 75 / 0.5), 0 0 24px oklch(0.72 0.12 75 / 0.15)" }}
        />
      </motion.div>

      {/* Progress hint */}
      <AnimatePresence>
        {hasStarted && !isRevealed && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ width: 120, background: "oklch(0.25 0.04 250)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #c9a227, #f5e070)" }}
                animate={{ width: `${Math.round(scratchPercent * 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-gold/60 text-xs">
              {Math.round(scratchPercent * 100)}%
            </span>
          </motion.div>
        )}
        {isRevealed && (
          <motion.p
            className="text-gold text-sm font-medium"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ✅ הרמז נחשף! ממשיכים...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
