/**
 * HaMerutz L-70 — useScratchAudio hook
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Provides two audio functions using the Web Audio API (no external files needed):
 *
 * 1. playScratch() — a short white-noise burst that sounds like scratching a card.
 *    Called continuously while the user is dragging.
 *    Uses a BufferSource with white noise + bandpass filter + fast envelope.
 *
 * 2. playSuccess() — a triumphant 3-note ascending fanfare chord.
 *    Called once when the card is fully revealed.
 *    Uses OscillatorNodes with a warm major-chord progression.
 *
 * Browser autoplay policy: AudioContext must be resumed on first user gesture.
 * We resume lazily on the first call to either function.
 */

import { useRef, useCallback } from "react";

export function useScratchAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastScratchRef = useRef<number>(0);

  // Lazily create / resume AudioContext
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  /**
   * playScratch — white-noise burst (≈40 ms)
   * Throttled to max 30 calls/sec to avoid audio glitching.
   */
  const playScratch = useCallback(() => {
    const now = performance.now();
    if (now - lastScratchRef.current < 33) return; // throttle ~30fps
    lastScratchRef.current = now;

    try {
      const ctx = getCtx();
      const bufferSize = ctx.sampleRate * 0.04; // 40 ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      // White noise source
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass filter: centre ~3 kHz — paper-scratch frequency range
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 3000;
      filter.Q.value = 0.8;

      // Gain envelope: fast attack, fast decay
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.005);  // attack 5 ms
      gain.gain.linearRampToValueAtTime(0, t + 0.04);       // decay 35 ms

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(t);
      source.stop(t + 0.04);
    } catch {
      // Silently ignore — audio is enhancement only
    }
  }, [getCtx]);

  /**
   * playSuccess — triumphant ascending fanfare
   * Three notes: C5 → E5 → G5 → C6 (major arpeggio), then a sustaining chord.
   */
  const playSuccess = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;

      // Master gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.4, t);
      master.gain.linearRampToValueAtTime(0, t + 2.2); // fade out over 2.2s
      master.connect(ctx.destination);

      // Reverb-like effect: convolver with impulse
      const convolver = ctx.createConvolver();
      const irLength = ctx.sampleRate * 1.5;
      const irBuffer = ctx.createBuffer(2, irLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = irBuffer.getChannelData(ch);
        for (let i = 0; i < irLength; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLength, 2);
        }
      }
      convolver.buffer = irBuffer;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.25;
      convolver.connect(reverbGain);
      reverbGain.connect(master);

      // Arpeggio notes: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const delays = [0, 0.12, 0.24, 0.38];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;

        const g = ctx.createGain();
        const start = t + delays[i];
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.5, start + 0.03);  // fast attack
        g.gain.exponentialRampToValueAtTime(0.001, start + 1.4); // long decay

        osc.connect(g);
        g.connect(master);
        g.connect(convolver);
        osc.start(start);
        osc.stop(start + 1.5);
      });

      // Sparkle layer: high-frequency shimmer (triangle wave)
      const shimmer = ctx.createOscillator();
      shimmer.type = "triangle";
      shimmer.frequency.value = 2093; // C7
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, t + 0.35);
      shimmerGain.gain.linearRampToValueAtTime(0.15, t + 0.45);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(master);
      shimmer.start(t + 0.35);
      shimmer.stop(t + 1.8);
    } catch {
      // Silently ignore
    }
  }, [getCtx]);

  return { playScratch, playSuccess };
}
