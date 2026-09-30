// src/utils/soundEngine.ts
/**
 * Minimal sound engine using native Web Audio API.
 * No external audio files – all sounds are generated procedurally.
 */
export class SoundEngine {
  private static instance: SoundEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private muteKey = "zen_sudoku_sound_muted";
  public isMuted: boolean = false;

  private constructor() {
    const stored = localStorage.getItem(this.muteKey);
    this.isMuted = stored === "true";
  }

  /** Get singleton (creates on first call) */
  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  /** Unlock the AudioContext on first user gesture */
  private unlock(): void {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Create a silent buffer to resume on iOS
    const buffer = this.audioCtx.createBuffer(1, 1, 22050);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);
    source.start(0);
  }

  private play(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = "sine",
    envelope: (gain: GainNode, ctx: AudioContext) => void
  ): void {
    if (this.isMuted) return;
    this.unlock();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    envelope(gain, ctx);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public playClick(): void {
    this.play(
      800,
      200,
      0.04,
      "sine",
      (gain, ctx) => {
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      }
    );
  }

  public playErase(): void {
    this.play(
      400,
      150,
      0.05,
      "sine",
      (gain, ctx) => {
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      }
    );
  }

  public playError(): void {
    // two short triangular pulses
    if (this.isMuted) return;
    this.unlock();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const freq = 130 - i * 20; // 130Hz then 110Hz
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.connect(gain).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.08;
      osc.start(start);
      osc.stop(start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
    }
  }

  public playWin(): void {
    if (this.isMuted) return;
    this.unlock();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5 (major chord)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.8);
    });
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    localStorage.setItem(this.muteKey, String(this.isMuted));
  }
}
