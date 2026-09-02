import {
  PipelineStats,
  ApiSource,
  AssetDataFeed,
  SuperSignal,
  SilentDiscardLog,
  GraVerificationRecord,
  MarketState,
} from '../types';

export interface SyncState {
  stats: PipelineStats;
  apis: ApiSource[];
  assets: AssetDataFeed[];
  signals: SuperSignal[];
  silentLogs: SilentDiscardLog[];
  graRecords: GraVerificationRecord[];
  marketState: MarketState;
  resolutionRho: number;
  isRunning: boolean;
  simulationSpeed: number;
  serverTickCount: number;
  serverTimestamp: number;
  latencyMs: number;
  isBackendConnected: boolean;
  lastSyncTime: Date;
}

export type SyncListener = (state: SyncState, newSignal?: SuperSignal) => void;

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isConnected = false;
  private latencyMs = 1;
  private pingInterval: any = null;
  private reconnectTimer: any = null;

  constructor() {
    this.connect();
    this.startPingLoop();
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private connect() {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
    }

    try {
      this.eventSource = new EventSource('/api/stream');

      this.eventSource.addEventListener('INIT_STATE', (e: MessageEvent) => {
        this.isConnected = true;
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners(data);
        } catch (err) {
          console.warn('[SSE] Parse error in INIT_STATE:', err);
        }
      });

      this.eventSource.addEventListener('TICK', (e: MessageEvent) => {
        this.isConnected = true;
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners(data, data.newSignal);
        } catch (err) {
          console.warn('[SSE] Parse error in TICK:', err);
        }
      });

      this.eventSource.addEventListener('STATE_CHANGE', (e: MessageEvent) => {
        this.isConnected = true;
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners(data);
        } catch (err) {
          console.warn('[SSE] Parse error in STATE_CHANGE:', err);
        }
      });

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        try {
          this.eventSource?.close();
        } catch {}
        // Retry connection after 2 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 2000);
        }
      };
    } catch (err) {
      console.warn('[SSE] Failed to initialize EventSource:', err);
      this.isConnected = false;
    }
  }

  private startPingLoop() {
    if (typeof window === 'undefined') return;

    const measurePing = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/ping');
        if (res.ok) {
          const end = performance.now();
          this.latencyMs = Math.max(1, Math.round(end - start));
          this.isConnected = true;
        }
      } catch {
        this.isConnected = false;
      }
    };

    // Initial ping
    measurePing();
    this.pingInterval = setInterval(measurePing, 3000);
  }

  private notifyListeners(data: any, newSignal?: SuperSignal) {
    const syncState: SyncState = {
      stats: data.stats,
      apis: data.apis,
      assets: data.assets,
      signals: data.signals,
      silentLogs: data.silentLogs,
      graRecords: data.graRecords,
      marketState: data.marketState,
      resolutionRho: data.resolutionRho,
      isRunning: data.isRunning,
      simulationSpeed: data.simulationSpeed,
      serverTickCount: data.serverTickCount || 0,
      serverTimestamp: data.serverTimestamp || Date.now(),
      latencyMs: this.latencyMs,
      isBackendConnected: this.isConnected,
      lastSyncTime: new Date(),
    };

    this.listeners.forEach((fn) => fn(syncState, newSignal));
  }

  // Send control commands to server
  public async sendControl(action: string, value?: any): Promise<boolean> {
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, value }),
      });
      if (res.ok) {
        const data = await res.json();
        this.notifyListeners(data);
        return true;
      }
    } catch (err) {
      console.error('[Sync] Control error:', err);
    }
    return false;
  }

  public getLatencyMs(): number {
    return this.latencyMs;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeSync = new RealtimeSyncManager();
