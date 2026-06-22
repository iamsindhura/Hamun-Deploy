"use client";

// Lazily initialized audio context
let audioCtx: AudioContext | null = null;

const getVolumeMultiplier = (volume: string) => {
  switch (volume) {
    case "LOW":
      return 0.1;
    case "HIGH":
      return 0.5;
    case "MEDIUM":
    default:
      return 0.25;
  }
};

const initAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

// Helper to play a single tone
const playTone = (
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  volMultiplier: number
) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volMultiplier, startTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playAudioCue = (
  type: "start" | "checkpoint" | "warning" | "complete",
  volume: "LOW" | "MEDIUM" | "HIGH" = "HIGH"
) => {
  const ctx = initAudioContext();
  if (!ctx) return;

  const v = getVolumeMultiplier(volume);
  const now = ctx.currentTime;

  switch (type) {
    case "start":
      // Soft rising two-note chime
      playTone(ctx, 440, "sine", now, 1.5, v); // A4
      playTone(ctx, 659.25, "sine", now + 0.2, 2.0, v); // E5
      break;

    case "checkpoint":
      // Gentle, low-frequency single pulse
      playTone(ctx, 349.23, "sine", now, 1.0, v * 0.7); // F4
      break;

    case "warning":
      // Distinct double pulse (slightly sharper using triangle)
      playTone(ctx, 880, "triangle", now, 0.5, v * 0.8); // A5
      playTone(ctx, 880, "triangle", now + 0.3, 0.5, v * 0.8); // A5
      break;

    case "complete":
      // Pleasant 3-note major chord sequence resolving up
      playTone(ctx, 523.25, "sine", now, 1.0, v); // C5
      playTone(ctx, 659.25, "sine", now + 0.3, 1.0, v); // E5
      playTone(ctx, 783.99, "sine", now + 0.6, 2.5, v); // G5
      break;
  }
};
