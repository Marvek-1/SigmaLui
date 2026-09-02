import { NeutrosophicTriple, NeutrosophicMatrixRow, ApiSource } from '../types';

/**
 * Deneutrosophication function converting (T, I, F) into crisp single value S(x)
 * Formula: S(x) = (2 + T - I - F) / 3
 */
export function deneutrosophicate(t: number, i: number, f: number): number {
  return (2 + t - i - f) / 3;
}

/**
 * Accuracy Degree A(x) = T - F
 */
export function getAccuracyDegree(t: number, f: number): number {
  return t - f;
}

/**
 * Analyzes conflicting signals across the 20 APIs to compute the Degree of Indeterminacy (I).
 * For instance: Binance Volume surging (Bullish) vs Whale Alert moving to exchanges (Bearish).
 */
export function calculateNeutrosophicConsensus(
  apis: ApiSource[],
  marketVolatility: number = 0.4
): {
  overallTriple: NeutrosophicTriple;
  isConfusedState: boolean;
  idealSolutionDistancePenalty: number;
  matrixRows: NeutrosophicMatrixRow[];
  conflictSpread: number;
} {
  let bullCount = 0;
  let bearCount = 0;
  let neutralCount = 0;
  let weightedT = 0;
  let weightedF = 0;
  let totalWeight = 0;

  apis.forEach((api) => {
    const w = api.currentWeight * api.reliabilityScore;
    totalWeight += w;
    if (api.signalDirection === 'BULLISH') {
      bullCount++;
      weightedT += w * 0.9;
      weightedF += w * 0.1;
    } else if (api.signalDirection === 'BEARISH') {
      bearCount++;
      weightedT += w * 0.1;
      weightedF += w * 0.9;
    } else {
      neutralCount++;
      weightedT += w * 0.5;
      weightedF += w * 0.5;
    }
  });

  const normWeight = totalWeight > 0 ? totalWeight : 1;
  const avgT = Math.min(1, Math.max(0, weightedT / normWeight));
  const avgF = Math.min(1, Math.max(0, weightedF / normWeight));

  // Indeterminacy increases when there is high divergence between bull & bear sources
  // or when market volatility is surging
  const totalDirections = bullCount + bearCount + neutralCount;
  const bullRatio = totalDirections > 0 ? bullCount / totalDirections : 0;
  const bearRatio = totalDirections > 0 ? bearCount / totalDirections : 0;
  
  // Maximum conflict when bullRatio approx equals bearRatio and both are non-zero
  const conflictSpread = 4 * bullRatio * bearRatio; // 0 to 1
  
  // Base Indeterminacy influenced by conflict spread and volatility
  const computedI = Math.min(1, Math.max(0.02, 0.65 * conflictSpread + 0.35 * marketVolatility));

  const overallScore = deneutrosophicate(avgT, computedI, avgF);
  const isConfusedState = computedI > 0.30;

  // In "Confused" states, the TOPSIS Ideal Solution is moved further away,
  // making it mathematically impossible for a signal to reach the 0.95 score.
  // Penalty factor scales non-linearly with I above 0.20
  const idealSolutionDistancePenalty = isConfusedState
    ? 1.0 + (computedI - 0.20) * 3.8
    : 1.0;

  // Build matrix rows for detailed breakdown
  const matrixRows: NeutrosophicMatrixRow[] = apis.map((api) => {
    let t = 0.5;
    let f = 0.5;
    let i = computedI;

    if (api.signalDirection === 'BULLISH') {
      t = Math.min(0.98, 0.7 + api.reliabilityScore * 0.25);
      f = Math.max(0.02, 0.3 - api.reliabilityScore * 0.25);
    } else if (api.signalDirection === 'BEARISH') {
      t = Math.max(0.02, 0.3 - api.reliabilityScore * 0.25);
      f = Math.min(0.98, 0.7 + api.reliabilityScore * 0.25);
    }

    const rowScore = deneutrosophicate(t, i, f);
    return {
      criterionId: api.id,
      criterionName: api.name,
      category: api.category,
      T: Number(t.toFixed(3)),
      I: Number(i.toFixed(3)),
      F: Number(f.toFixed(3)),
      calculatedWeight: api.currentWeight,
      deneutrosophicatedScore: Number(rowScore.toFixed(3)),
      conflictContribution: Number((Math.abs(t - f) < 0.2 ? 0.8 : 0.2).toFixed(2)),
    };
  });

  return {
    overallTriple: {
      T: Number(avgT.toFixed(3)),
      I: Number(computedI.toFixed(3)),
      F: Number(avgF.toFixed(3)),
      score: Number(overallScore.toFixed(3)),
    },
    isConfusedState,
    idealSolutionDistancePenalty,
    matrixRows,
    conflictSpread: Number(conflictSpread.toFixed(3)),
  };
}
