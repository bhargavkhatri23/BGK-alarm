type TimerCallback = () => void;

class BackgroundTimerService {
  private timerId: number | null = null;
  private subscribers: Set<TimerCallback> = new Set();
  private isRunning: boolean = false;
  private wakeLock: any = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public subscribe(callback: TimerCallback): () => void {
    this.subscribers.add(callback);
    if (!this.isRunning) {
      this.start();
    }
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  public async requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch {
      // Ignored
    }
  }

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.requestWakeLock();

    const tick = () => {
      this.notifySubscribers();
      if (this.isRunning) {
        this.timerId = window.setTimeout(tick, 1000);
      }
    };

    this.timerId = window.setTimeout(tick, 1000);
  }

  private stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('Error in background timer subscriber:', err);
      }
    });
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.requestWakeLock();
      this.notifySubscribers();
    }
  }
}

export const backgroundTimer = new BackgroundTimerService();
