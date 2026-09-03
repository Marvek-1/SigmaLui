import { DailyAccuracy, CalibrationMetrics } from '../types';

export interface RawDailyAccuracyInput {
  date: string;
  wins?: number | null;
  losses?: number | null;
  predictionConfidence?: number | null;
  [key: string]: any; // safely ignore any pre-supplied corrupted winRate/lossRate
}

/**
 * Hardened Normalization function for DailyAccuracy rows.
 * Invariant: Never trust supplied winRate/lossRate. Always recompute from validated wins and losses.
 * Invalid or missing predictionConfidence becomes null (not fake zero).
 * Returns null if resolvedSignals (wins + losses) is 0.
 */
export function normalizeDailyAccuracy(
  row: RawDailyAccuracyInput
): DailyAccuracy | null {
  if (!row || typeof row.date !== 'string') return null;

  // Sanitize integer counts (truncate decimals, clamp negative to 0)
  const rawWins = Number(row.wins);
  const rawLosses = Number(row.losses);
  
  const wins = Number.isFinite(rawWins) ? Math.max(0, Math.trunc(rawWins)) : 0;
  const losses = Number.isFinite(rawLosses) ? Math.max(0, Math.trunc(rawLosses)) : 0;
  const resolvedSignals = wins + losses;

  if (resolvedSignals === 0) return null;

  const winRate = Number(((wins / resolvedSignals) * 100).toFixed(4));
  const lossRate = Number((100 - winRate).toFixed(4));

  // Sanitize predictionConfidence: strictly 0-100 or null if NaN/missing
  let predictionConfidence: number | null = null;
  if (
    row.predictionConfidence !== undefined &&
    row.predictionConfidence !== null &&
    Number.isFinite(Number(row.predictionConfidence))
  ) {
    const parsed = Number(row.predictionConfidence);
    predictionConfidence = Number(Math.min(100, Math.max(0, parsed)).toFixed(2));
  }

  return {
    date: row.date.trim(),
    wins,
    losses,
    resolvedSignals,
    winRate: Number(winRate.toFixed(2)),
    lossRate: Number(lossRate.toFixed(2)),
    predictionConfidence,
  };
}

/**
 * Normalizes a list of raw daily inputs, deduplicating identical dates,
 * removing 0-resolved rows, and sorting them chronologically.
 */
export function processDailyAccuracySeries(
  rawRows: RawDailyAccuracyInput[]
): DailyAccuracy[] {
  if (!Array.isArray(rawRows)) return [];

  // Group and merge by date to handle duplicate settlement dates safely
  const mapByDate = new Map<string, { wins: number; losses: number; confidences: number[] }>();

  for (const raw of rawRows) {
    if (!raw || !raw.date) continue;
    const dateKey = String(raw.date).trim();
    const existing = mapByDate.get(dateKey) || { wins: 0, losses: 0, confidences: [] };

    const rawWins = Number(raw.wins);
    const rawLosses = Number(raw.losses);
    if (Number.isFinite(rawWins) && rawWins > 0) existing.wins += Math.max(0, Math.trunc(rawWins));
    if (Number.isFinite(rawLosses) && rawLosses > 0) existing.losses += Math.max(0, Math.trunc(rawLosses));

    if (raw.predictionConfidence !== undefined && raw.predictionConfidence !== null && Number.isFinite(Number(raw.predictionConfidence))) {
      existing.confidences.push(Math.min(100, Math.max(0, Number(raw.predictionConfidence))));
    }

    mapByDate.set(dateKey, existing);
  }

  const result: DailyAccuracy[] = [];

  for (const [date, entry] of mapByDate.entries()) {
    const meanConf = entry.confidences.length > 0
      ? entry.confidences.reduce((a, b) => a + b, 0) / entry.confidences.length
      : null;

    const normalized = normalizeDailyAccuracy({
      date,
      wins: entry.wins,
      losses: entry.losses,
      predictionConfidence: meanConf,
    });

    if (normalized) {
      result.push(normalized);
    }
  }

  // Sort chronologically by date
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculates 95% Wilson Score Confidence Interval for binomial proportion.
 * For n=19, 18 wins -> Wilson Interval is ~75.4% to 99.1%.
 */
export function computeWilsonScoreInterval(
  wins: number,
  total: number,
  z: number = 1.96 // 95% confidence level
): { lowerPct: number; upperPct: number } {
  if (total <= 0) return { lowerPct: 0, upperPct: 0 };
  const p = wins / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = p + z2 / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);

  const lower = Math.max(0, (center - spread) / denominator);
  const upper = Math.min(1, (center + spread) / denominator);

  return {
    lowerPct: Number((lower * 100).toFixed(1)),
    upperPct: Number((upper * 100).toFixed(1)),
  };
}

/**
 * Computes consolidated calibration metrics and reconciliation.
 */
export function computeCalibrationMetrics(
  rows: DailyAccuracy[],
  windowLabel: string = '7D Horizon'
): CalibrationMetrics {
  const totals = rows.reduce(
    (acc, row) => {
      acc.wins += row.wins;
      acc.losses += row.losses;
      return acc;
    },
    { wins: 0, losses: 0 }
  );

  const totalResolved = totals.wins + totals.losses;
  const empiricalWinRate = totalResolved > 0
    ? Number(((totals.wins / totalResolved) * 100).toFixed(2))
    : null;

  const validConfidenceRows = rows.filter((r) => r.predictionConfidence !== null);
  const meanPredictedProbability = validConfidenceRows.length > 0
    ? Number(
        (
          validConfidenceRows.reduce((sum, r) => sum + (r.predictionConfidence ?? 0), 0) /
          validConfidenceRows.length
        ).toFixed(2)
      )
    : null;

  // Approximate Brier score across resolved items: mean of (p - y)^2
  let brierScore: number | null = null;
  let ece: number | null = null;

  if (totalResolved > 0 && meanPredictedProbability !== null) {
    // Weighted squared error across daily buckets
    let sumSquaredError = 0;
    let sumAbsCalibrationDiff = 0;
    
    for (const r of validConfidenceRows) {
      const predP = (r.predictionConfidence ?? 0) / 100;
      const actualP = r.winRate / 100;
      sumSquaredError += Math.pow(predP - actualP, 2) * r.resolvedSignals;
      sumAbsCalibrationDiff += Math.abs(predP - actualP) * r.resolvedSignals;
    }

    brierScore = Number((sumSquaredError / totalResolved).toFixed(4));
    ece = Number(((sumAbsCalibrationDiff / totalResolved) * 100).toFixed(2));
  }

  const wilson = computeWilsonScoreInterval(totals.wins, totalResolved);

  // Status classification with honest telemetry
  let calibrationStatus: CalibrationMetrics['calibrationStatus'] = 'INSUFFICIENT_SAMPLE';
  if (totalResolved >= 50 && meanPredictedProbability !== null && empiricalWinRate !== null) {
    const diff = empiricalWinRate - meanPredictedProbability;
    if (Math.abs(diff) <= 3.0) calibrationStatus = 'CALIBRATED';
    else if (diff < -3.0) calibrationStatus = 'OVERCONFIDENT';
    else calibrationStatus = 'UNDERCONFIDENT';
  } else {
    calibrationStatus = 'INSUFFICIENT_SAMPLE';
  }

  return {
    meanPredictedProbability,
    empiricalWinRate,
    brierScore,
    expectedCalibrationError: ece,
    calibrationSampleSize: totalResolved,
    calibrationWindow: windowLabel,
    wilsonIntervalLowerPct: wilson.lowerPct,
    wilsonIntervalUpperPct: wilson.upperPct,
    calibrationStatus,
  };
}
