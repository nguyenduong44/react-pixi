/**
 * SoundManager — Web Audio API based 8-bit sound effects
 * No external assets required, generates sounds procedurally
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.15,
    pitchEnd?: number
  ) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (pitchEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(pitchEnd, ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {
      // Silence audio errors
    }
  }

  playClick() {
    // 8-bit click: quick descending blip
    this.playTone(880, 0.08, 'square', 0.2, 440);
    setTimeout(() => this.playTone(220, 0.06, 'square', 0.1), 60);
  }

  playHover() {
    // Soft hover tick
    this.playTone(660, 0.05, 'square', 0.08, 720);
  }

  playMenuOpen() {
    // Ascending fanfare-ish
    const notes = [262, 330, 392, 523];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'square', 0.15), i * 60);
    });
  }

  playMenuBack() {
    // Descending
    const notes = [523, 392, 330, 262];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'square', 0.12), i * 50);
    });
  }

  setEnabled(val: boolean) {
    this.enabled = val;
  }
}

export const soundManager = new SoundManager();
