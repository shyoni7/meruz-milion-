/**
 * SlidingPuzzle — 3x3 sliding tile puzzle built from a single image.
 * Tap a tile next to the empty slot to slide it. Calls onSolved when done.
 */

import { useEffect, useMemo, useState } from "react";

const SIZE = 3;
const EMPTY = SIZE * SIZE - 1; // last tile is the empty slot

function neighbors(idx: number): number[] {
  const row = Math.floor(idx / SIZE);
  const col = idx % SIZE;
  const out: number[] = [];
  if (row > 0) out.push(idx - SIZE);
  if (row < SIZE - 1) out.push(idx + SIZE);
  if (col > 0) out.push(idx - 1);
  if (col < SIZE - 1) out.push(idx + 1);
  return out;
}

/** Shuffle by performing random valid moves from the solved state (always solvable) */
function shuffled(): number[] {
  const board = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  let emptyPos = board.indexOf(EMPTY);
  let prev = -1;
  for (let i = 0; i < 80; i++) {
    const options = neighbors(emptyPos).filter((n) => n !== prev);
    const pick = options[Math.floor(Math.random() * options.length)];
    [board[emptyPos], board[pick]] = [board[pick], board[emptyPos]];
    prev = emptyPos;
    emptyPos = pick;
  }
  return board;
}

interface SlidingPuzzleProps {
  imageUrl: string;
  onSolved: () => void;
}

export default function SlidingPuzzle({ imageUrl, onSolved }: SlidingPuzzleProps) {
  const [board, setBoard] = useState<number[]>(() => shuffled());
  const [solved, setSolved] = useState(false);

  const isSolved = useMemo(() => board.every((tile, i) => tile === i), [board]);

  useEffect(() => {
    if (isSolved && !solved) {
      setSolved(true);
      // Show the completed image briefly before advancing
      const t = setTimeout(onSolved, 1200);
      return () => clearTimeout(t);
    }
  }, [isSolved, solved, onSolved]);

  const handleTap = (pos: number) => {
    if (solved) return;
    const emptyPos = board.indexOf(EMPTY);
    if (!neighbors(pos).includes(emptyPos)) return;
    setBoard((b) => {
      const next = [...b];
      [next[pos], next[emptyPos]] = [next[emptyPos], next[pos]];
      return next;
    });
  };

  return (
    <div className="w-full">
      <div
        className="grid grid-cols-3 gap-1 w-full aspect-square rounded-xl overflow-hidden border border-[#c9a84c]/40 bg-black/40"
        dir="ltr"
      >
        {board.map((tile, pos) => {
          const isEmpty = tile === EMPTY && !solved;
          const row = Math.floor(tile / SIZE);
          const col = tile % SIZE;
          return (
            <button
              key={pos}
              onClick={() => handleTap(pos)}
              className="relative w-full h-full"
              style={
                isEmpty
                  ? { background: "oklch(0.13 0.03 250)" }
                  : {
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: `${SIZE * 100}% ${SIZE * 100}%`,
                      backgroundPosition: `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`,
                    }
              }
              aria-label={isEmpty ? "משבצת ריקה" : `אריח ${tile + 1}`}
            />
          );
        })}
      </div>
      {solved && (
        <p className="text-center text-gold font-bold text-lg mt-3 animate-pulse">
          🎉 הפאזל הושלם!
        </p>
      )}
    </div>
  );
}
