/**
 * BirthdayVerse - Web Audio Sound Engine
 * Synthesizes pristine sound effects and ambient music with 0 external network dependencies.
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/**
 * Play a gentle tactile UI tap chime
 */
export function playChime(frequency: number = 523.25): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio policies handled silently
  }
}

/**
 * Play celebratory blowout sound (wind breath + ascending fairy dust chimes)
 */
export function playBlowoutSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // 1. Wind breath puff (filtered white noise)
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start();

    // 2. Ascending celebration chime arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + 0.1 + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.55);
    });
  } catch {
    // Ignore audio policy errors
  }
}

/**
 * Play wax seal cracking sound (crisp snap & resonance)
 */
export function playSealCrackSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Fast resonant pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    // Secondary subtle chime
    playChime(880);
  } catch {
    // Ignore audio policy errors
  }
}

/**
 * Play gift box unboxing harp sound
 */
export function playBoxOpenSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [440, 554.37, 659.25, 880, 1108.73];
    chords.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.65);
    });
  } catch {
    // Ignore audio policy errors
  }
}

/**
 * Play coin scratch friction sound
 */
export function playScratchSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600 + Math.random() * 400, ctx.currentTime);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // Ignore audio policy errors
  }
}

/**
 * Ambient Melody Looper (Dreamy Music Box / Celesta style)
 */
class AmbientMusicPlayer {
  private timer: any = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0;

  // Harmonious, soothing C-Major / A-Minor pentatonic scale
  private melodyProgression = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    659.25, // E5
    523.25, // C5
    587.33, // D5
    783.99, // G5
    1046.50 // C6
  ];

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.scheduleNextNote();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextNote(): void {
    if (!this.isPlaying) return;

    try {
      const ctx = getAudioContext();
      if (ctx) {
        const freq = this.melodyProgression[this.currentStep % this.melodyProgression.length];
        this.currentStep++;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Very soft, gentle celesta decay
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.95);
      }
    } catch {
      // Ignore
    }

    // Schedule next note every 500-700ms with organic timing
    const delay = 480 + Math.random() * 80;
    this.timer = setTimeout(() => this.scheduleNextNote(), delay);
  }
}

export const ambientPlayer = new AmbientMusicPlayer();
