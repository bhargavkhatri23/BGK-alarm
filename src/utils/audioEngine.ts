/**
 * Web Audio API synthesizer for BGK Yadgiri Alarms.
 * Provides authentic, self-contained alarm ringtones without external audio dependencies.
 */

class AudioAlarmEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentInterval: number | null = null;
  private activeGainNodes: GainNode[] = [];
  private activeOscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;
  private volume: number = 0.8;

  public initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public stop() {
    this.isPlaying = false;
    if (this.currentInterval) {
      window.clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    });
    this.activeOscillators = [];
    this.activeGainNodes.forEach((gain) => {
      try {
        gain.disconnect();
      } catch {
        // Already disconnected
      }
    });
    this.activeGainNodes = [];
  }

  /**
   * Swiggy / Zomato style high-alert order siren
   * Distinctive urgent rapid dual-pitch chime pulses
   */
  private playSwiggyPattern() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const playChirp = (offset: number, freq1: number, freq2: number) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq1, t);
      osc.frequency.exponentialRampToValueAtTime(freq2, t + 0.12);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.7, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);
    };

    // Staccato two-tone burst repeated
    playChirp(0.0, 1174, 1480); // D6 to F#6
    playChirp(0.12, 1480, 1760); // F#6 to A6
    playChirp(0.24, 1760, 2200); // High ping
    playChirp(0.42, 1760, 2200);
    playChirp(0.56, 1480, 1760);
    playChirp(0.70, 1174, 1480);
  }

  /**
   * Classic Digital Beep (Pip-pip-pip-pip)
   */
  private playDigitalBeepPattern() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const beeps = [0, 0.15, 0.3, 0.45];
    beeps.forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.5, t); // C6

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
      gain.gain.setValueAtTime(0.35, t + 0.08);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);
      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);
    });
  }

  /**
   * Soft Morning Bell / Chime (Tibetan singing bowl harmonics)
   */
  private playSoftBellPattern() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C Major chord
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4 / (idx + 1), t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.3);
      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);
    });
  }

  /**
   * Emergency Hooter / Siren
   */
  private playEmergencyHooterPattern() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.5);
    osc.frequency.linearRampToValueAtTime(650, now + 1.0);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.setValueAtTime(0.4, now + 0.9);
    gain.gain.linearRampToValueAtTime(0.001, now + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.05);
    this.activeOscillators.push(osc);
    this.activeGainNodes.push(gain);
  }

  /**
   * Melodic Chime / Flute
   */
  private playMelodicChimePattern() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const melody = [587.33, 659.25, 880, 987.77, 1174.66]; // D5, E5, A5, B5, D6

    melody.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.55);
      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);
    });
  }

  public play(ringtoneName: string = 'क्लासिक डिजिटल बीप', loop: boolean = true) {
    this.initContext();
    this.stop();
    this.isPlaying = true;

    const triggerOnce = () => {
      if (!this.isPlaying) return;
      this.playDigitalBeepPattern();
    };

    triggerOnce();

    if (loop) {
      // Classic 4-beep sequence repeat every 1100ms
      this.currentInterval = window.setInterval(() => {
        if (!this.isPlaying) return;
        triggerOnce();
      }, 1100);
    }
  }

  public preview(ringtoneName: string, durationMs: number = 3200) {
    this.play(ringtoneName, true);
    window.setTimeout(() => {
      this.stop();
    }, durationMs);
  }
}

export const audioEngine = new AudioAlarmEngine();
