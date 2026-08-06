/**
 * HaMerutz L-70 — tear sound for the sealed envelope.
 * Continuous band-passed noise whose loudness/brightness track the drag
 * progress on the adhesive tape, plus a low "thud" when the flap opens.
 * Web Audio only — no external files. Provided by the game manager.
 */

type TearSound = {
  start: () => void;
  setIntensity: (value: number) => void;
  stop: () => void;
  thud: () => void;
};

function makeNoiseBuffer(ctx: AudioContext) {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.6;
  return buffer;
}

export function createTearSound(): TearSound {
  let ctx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let gain: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;

  const ensureCtx = () => {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  return {
    start() {
      const audio = ensureCtx();
      if (!audio || source) return;
      source = audio.createBufferSource();
      source.buffer = makeNoiseBuffer(audio);
      source.loop = true;
      filter = audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2600;
      filter.Q.value = 0.7;
      gain = audio.createGain();
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(audio.destination);
      source.start();
    },
    setIntensity(value) {
      if (!ctx || !gain || !filter) return;
      const clamped = Math.min(1, Math.max(0, value));
      const now = ctx.currentTime;
      gain.gain.setTargetAtTime(clamped * 0.16, now, 0.04);
      filter.frequency.setTargetAtTime(1600 + clamped * 3200, now, 0.05);
    },
    stop() {
      if (!ctx || !gain || !source) return;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
      const dying = source;
      source = null;
      window.setTimeout(() => {
        try { dying.stop(); dying.disconnect(); } catch { /* already stopped */ }
      }, 320);
    },
    thud() {
      const audio = ensureCtx();
      if (!audio) return;
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(58, audio.currentTime + 0.25);
      g.gain.setValueAtTime(0.0001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.13, audio.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.32);
      osc.connect(g).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.34);
    },
  };
}
