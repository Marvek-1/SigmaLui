import { TopsisCalculation, CriteriaItem } from '../types';

export type { CriteriaItem };

/**
 * Calculates TOPSIS ranking and Closeness Coefficient (Ci).
 * Integrates dynamic penalty when Indeterminacy is elevated.
 */
export function calculateTOPSIS(
  criteria: CriteriaItem[],
  idealPenaltyOffset: number = 1.0,
  indeterminacy: number = 0.08
): TopsisCalculation {
  if (criteria.length === 0) {
    return {
      idealSolutionOffset: idealPenaltyOffset,
      dPlus: 1,
      dMinus: 0,
      closenessCoefficient: 0,
      passed95Threshold: false,
      criteriaContributions: {},
      distanceMetricUsed: 'EUCLIDEAN',
    };
  }

  // 1. Normalize weights
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const normalizedWeights = criteria.map((c) => (totalWeight > 0 ? c.weight / totalWeight : 1 / criteria.length));

  // 2. Compute Weighted Values
  const weightedValues: number[] = [];
  const idealPositive: number[] = [];
  const idealNegative: number[] = [];
  const criteriaContributions: { [criterionId: string]: number } = {};

  criteria.forEach((c, idx) => {
    const w = normalizedWeights[idx];
    const val = Math.max(0, Math.min(1, c.value));
    const weighted = w * val;
    weightedValues.push(weighted);

    // Theoretical Positive Ideal (1.0 * w) with Indeterminacy penalty applied
    // In "Confused" states, the Positive Ideal is pushed farther away
    const idealVal = (c.isBenefit ? 1.0 : 0.0) * w * idealPenaltyOffset;
    const antiIdealVal = (c.isBenefit ? 0.0 : 1.0) * w;

    idealPositive.push(idealVal);
    idealNegative.push(antiIdealVal);
    criteriaContributions[c.id] = Number((val * 100).toFixed(1));
  });

  // 3. Calculate Euclidean Distances D+ and D-
  let sumSqPlus = 0;
  let sumSqMinus = 0;

  for (let i = 0; i < criteria.length; i++) {
    const v = weightedValues[i];
    const aPlus = idealPositive[i];
    const aMinus = idealNegative[i];

    sumSqPlus += Math.pow(v - aPlus, 2);
    sumSqMinus += Math.pow(v - aMinus, 2);
  }

  const dPlus = Math.sqrt(sumSqPlus);
  const dMinus = Math.sqrt(sumSqMinus);

  // 4. Calculate Closeness Coefficient Ci = D- / (D+ + D-)
  const denom = dPlus + dMinus;
  let closenessCoefficient = denom > 0 ? dMinus / denom : 0;

  // Round to 4 decimal places
  closenessCoefficient = Number(closenessCoefficient.toFixed(4));

  // 5. Check the 95% Gate: Ci > 0.95 and Indeterminacy < 0.15
  const passed95Threshold = closenessCoefficient > 0.95 && indeterminacy < 0.15;

  return {
    idealSolutionOffset: Number(idealPenaltyOffset.toFixed(3)),
    dPlus: Number(dPlus.toFixed(4)),
    dMinus: Number(dMinus.toFixed(4)),
    closenessCoefficient,
    passed95Threshold,
    criteriaContributions,
    distanceMetricUsed: 'EUCLIDEAN',
  };
}
