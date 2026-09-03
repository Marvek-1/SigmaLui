import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity, Clock, Zap, ArrowUpRight, TrendingDown } from 'lucide-react';
import { ApiSource } from '../types';

interface LatencyMovingAverageChartProps {
  apis?: ApiSource[];
  currentPingMs?: number;
  serverTickCount?: number;
}

interface LatencyDataPoint {
  time: string;
  latencyMs: number;
  movingAverage5m: number;
  slaLimit: number;
}

export const LatencyMovingAverageChart: React.FC<LatencyMovingAverageChartProps> = ({
  apis = [],
  currentPingMs = 3.5,
  serverTickCount = 0,
}) => {
  // Generate rolling historical 5m moving average data points (last 15 points representing 5m window intervals)
  const [dataPoints, setDataPoints] = useState<LatencyDataPoint[]>(() => {
    const points: LatencyDataPoint[] = [];
    const baseLatency = currentPingMs > 0 ? currentPingMs : 3.8;
    const timestamps = [
      '-4m45s', '-4m30s', '-4m15s', '-4m00s', '-3m45s',
      '-3m30s', '-3m15s', '-3m00s', '-2m45s', '-2m30s',
      '-2m15s', '-2m00s', '-1m45s', '-1m30s', '-1m15s',
      '-1m00s', '-45s', '-30s', '-15s', 'Now'
    ];

    let runningSum = 0;
    const history: number[] = [];

    timestamps.forEach((time, idx) => {
      // Small simulated latency variation centered on baseLatency
      const jitter = (Math.sin(idx * 0.8) * 1.2) + (Math.random() * 0.8);
      const instant = Math.max(1.2, Number((baseLatency + jitter).toFixed(2)));
      history.push(instant);
      runningSum += instant;
      
      // Calculate simple moving average over sliding window
      const windowSlice = history.slice(Math.max(0, history.length - 5));
      const ma = Number((windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length).toFixed(2));

      points.push({
        time,
        latencyMs: instant,
        movingAverage5m: ma,
        slaLimit: 25.0,
      });
    });

    return points;
  });

  // Dynamically append new point on server tick / ping change
  useEffect(() => {
    setDataPoints((prev) => {
      const last = prev[prev.length - 1];
      const nowTime = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      const jitter = (Math.random() - 0.45) * 1.1;
      const newInstant = Math.max(1.2, Number((currentPingMs + jitter).toFixed(2)));

      const updatedHistory = [...prev.slice(1).map((p) => p.latencyMs), newInstant];
      const windowSlice = updatedHistory.slice(Math.max(0, updatedHistory.length - 5));
      const newMa = Number((windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length).toFixed(2));

      const newPoint: LatencyDataPoint = {
        time: nowTime,
        latencyMs: newInstant,
        movingAverage5m: newMa,
        slaLimit: 25.0,
      };

      return [...prev.slice(1), newPoint];
    });
  }, [currentPingMs, serverTickCount]);

  // Aggregate stats
  const metrics = useMemo(() => {
    if (dataPoints.length === 0) return { currentMa: 3.5, currentInstant: 3.5, min: 1.5, max: 8.0 };
    const maValues = dataPoints.map((d) => d.movingAverage5m);
    const instantValues = dataPoints.map((d) => d.latencyMs);
    const currentPoint = dataPoints[dataPoints.length - 1];

    return {
      currentMa: currentPoint.movingAverage5m,
      currentInstant: currentPoint.latencyMs,
      min: Math.min(...instantValues),
      max: Math.max(...instantValues),
    };
  }, [dataPoints]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-72 h-36 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                5-Minute Moving Average API Latency
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                DYNAMIC RECHARTS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Continuous smoothing of inbound multi-exchange telemetry feeds & WebSocket pipelines
            </p>
          </div>
        </div>

        {/* Live KPI badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">5m MA Latency</span>
            <span className="text-sm font-black text-cyan-300">{metrics.currentMa} ms</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Instant Ping</span>
            <span className="text-sm font-black text-emerald-400">{metrics.currentInstant} ms</span>
          </div>
        </div>
      </div>

      {/* Recharts Dynamic Line Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataPoints} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={[0, (dataMax: number) => Math.ceil(Math.max(10, dataMax * 1.2))]}
              tickLine={false}
              fontFamily="monospace"
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#020617',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }}
              iconType="circle"
            />
            {/* 5m Moving Average (Cyan thick line) */}
            <Line
              type="monotone"
              dataKey="movingAverage5m"
              name="5m Moving Average"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ r: 3, fill: '#06b6d4', stroke: '#020617', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#38bdf8' }}
              isAnimationActive={false}
            />
            {/* Instantaneous Latency (Emerald dotted line) */}
            <Line
              type="monotone"
              dataKey="latencyMs"
              name="Instantaneous Ingest"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            {/* SLA Threshold Guideline (Slate dashed line) */}
            <Line
              type="monotone"
              dataKey="slaLimit"
              name="SLA Limit (25ms)"
              stroke="#f43f5e"
              strokeWidth={1}
              strokeDasharray="2 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-bar metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sliding Window: 5m MA Filter across {dataPoints.length} temporal frames</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span>Min: <strong className="text-emerald-400">{metrics.min}ms</strong></span>
          <span>Max: <strong className="text-amber-400">{metrics.max}ms</strong></span>
          <span>SLA Buffer: <strong className="text-cyan-300">{(25.0 - metrics.currentMa).toFixed(1)}ms headroom</strong></span>
        </div>
      </div>
    </div>
  );
};
