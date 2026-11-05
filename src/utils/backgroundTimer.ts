/**
 * Dedicated Background Worker & Persistence Manager for BGK Yadgiri
 * Ensures that timers continue firing accurately even when the app/browser tab
 * is pushed to the background, minimized, or subject to OS battery throttling.
 */

type TickCallback = () => void;

class BackgroundTimerService {
  private worker: Worker | null = null;
  private intervalId: number | null = null;
  private tickCallbacks: Set<TickCallback> = new Set();
  private wakeLockSentinel: unknown = null;
  private isWakeLockSupported: boolean = false;

  constructor() {
    this.isWakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    this.initWorker();
    this.initVisibilityListener();
  }

  /**
   * Creates an inline Web Worker that runs in its own execution thread.
   * Browsers do not throttle Web Worker timers the same way as main-thread window.setInterval
   * when the tab is backgrounded or minimized.
   */
  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        if (e.data === 'tick') {
          this.emitTick();
        }
      };
    } catch {
      // Fallback to standard window interval if Worker creation fails
      this.worker = null;
    }
  }

  private initVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Tab brought back into view: immediately re-check alarms to prevent any missed minute
        this.emitTick();
        // Re-acquire wake lock if it was released
        this.requestWakeLock();
      }
    });
  }

  private emitTick() {
    this.tickCallbacks.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore single callback error
      }
    });
  }

  public subscribe(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    if (this.tickCallbacks.size === 1) {
      this.start();
    }
    return () => {
      this.tickCallbacks.delete(cb);
      if (this.tickCallbacks.size === 0) {
        this.stop();
      }
    };
  }

  public start() {
    // 1. Start Web Worker ticker
    if (this.worker) {
      this.worker.postMessage('start');
    }

    // 2. Main-thread interval as dual backup
    if (!this.intervalId) {
      this.intervalId = window.setInterval(() => {
        this.emitTick();
      }, 1000);
    }
  }

  public stop() {
    if (this.worker) {
      this.worker.postMessage('stop');
    }
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.releaseWakeLock();
  }

  /**
   * Requests Screen Wake Lock to prevent aggressive system sleeping
   * when alarms are actively armed.
   */
  public async requestWakeLock(): Promise<boolean> {
    if (!this.isWakeLockSupported) return false;
    try {
      const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } };
      this.wakeLockSentinel = await nav.wakeLock.request('screen');
      return true;
    } catch {
      return false;
    }
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        const sentinel = this.wakeLockSentinel as { release: () => Promise<void> };
        sentinel.release();
      } catch {
        // Ignored
      }
      this.wakeLockSentinel = null;
    }
  }

  public isWorkerActive(): boolean {
    return this.worker !== null;
  }
}

export const backgroundTimer = new BackgroundTimerService();
