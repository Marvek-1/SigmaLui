import { GreyModelResult } from '../types';

export interface GmDetailedStep {
  stepName: string;
  formula: string;
  resultSummary: string;
  matrixData?: any;
}

export interface Gm11DetailedExecution {
  result: GreyModelResult;
  dataInput: number[];
  threshold: number;
  passedGate1: boolean;
  steps: GmDetailedStep[];
  pythonCode: string;
}

/**
 * Fits a GM(1,1) First-Order Differential Grey Model on raw sequence x0.
 * Typically receives last 5 data points from each data feed.
 */
export function calculateGM11(
  rawSequence: number[],
  noiseThreshold: number = 0.02
): GreyModelResult {
  const n = rawSequence.length;
  if (n < 4) {
    throw new Error('GM(1,1) requires at least 4 historical data points.');
  }

  // 1. Accumulated Generating Operation (1-AGO)
  const x1: number[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += rawSequence[i];
    x1.push(sum);
  }

  // 2. Mean sequence generated of consecutive neighbors: z1(k)
  const z1: number[] = [];
  for (let k = 1; k < n; k++) {
    z1.push(0.5 * x1[k] + 0.5 * x1[k - 1]);
  }

  // 3. Construct Matrix B and vector Y
  // B: (n-1) x 2, Y: (n-1) x 1
  // Row i of B is [-z1[i], 1], Row i of Y is x0[i+1]
  let b00 = 0, b01 = 0, b10 = 0, b11 = 0;
  let y0 = 0, y1 = 0;

  for (let i = 0; i < n - 1; i++) {
    const z = z1[i];
    const yVal = rawSequence[i + 1];

    // B^T * B
    b00 += z * z;
    b01 += -z * 1;
    b10 += -z * 1;
    b11 += 1 * 1;

    // B^T * Y
    y0 += -z * yVal;
    y1 += 1 * yVal;
  }

  // Determinant of (B^T * B)
  const det = b00 * b11 - b01 * b10;
  let a = 0.05;
  let b = rawSequence[0] * 0.05;

  if (Math.abs(det) > 1e-12) {
    // Inverse of 2x2 matrix
    const inv00 = b11 / det;
    const inv01 = -b01 / det;
    const inv10 = -b10 / det;
    const inv11 = b00 / det;

    a = inv00 * y0 + inv01 * y1;
    b = inv10 * y0 + inv11 * y1;
  }

  // Guard against extreme numerical blow-ups
  if (isNaN(a) || Math.abs(a) > 5) a = 0.02;
  if (isNaN(b) || Math.abs(b) > 1e9) b = rawSequence[0] * 0.02;

  // 4. Time response differential equation:
  // x1_hat(k+1) = (x0(1) - b/a) * exp(-a * k) + b/a
  const x0_1 = rawSequence[0];
  const bDivA = Math.abs(a) < 1e-9 ? 0 : b / a;

  const predictX1 = (k: number): number => {
    return (x0_1 - bDivA) * Math.exp(-a * k) + bDivA;
  };

  // 5. Fitted historical values (Inverse AGO)
  const predictedSequence: number[] = [rawSequence[0]];
  for (let k = 1; k < n; k++) {
    const fittedX1_curr = predictX1(k);
    const fittedX1_prev = predictX1(k - 1);
    const fittedX0 = fittedX1_curr - fittedX1_prev;
    predictedSequence.push(fittedX0);
  }

  // 6. Calculate Residuals & MRPE (Mean Relative Percentage Error)
  const residuals: number[] = [];
  let totalError = 0;
  for (let i = 0; i < n; i++) {
    const actual = rawSequence[i];
    const pred = predictedSequence[i];
    const absErr = Math.abs(actual) > 1e-6 ? Math.abs((actual - pred) / actual) : 0;
    residuals.push(absErr);
    totalError += absErr;
  }
  const meanRelativeError = totalError / n;
  const isStable = meanRelativeError <= noiseThreshold; // Gate 1 check

  // 7. Look-Ahead Window (k = n, n+1, n+2 for t+1, t+2, t+3 intervals)
  const step1 = predictX1(n) - predictX1(n - 1);
  const step2 = predictX1(n + 1) - predictX1(n);
  const step3 = predictX1(n + 2) - predictX1(n + 1);

  const lookaheadForecast: [number, number, number] = [step1, step2, step3];
  const lastActual = rawSequence[n - 1];
  const momentumDelta = lastActual > 0 ? ((step3 - lastActual) / lastActual) * 100 : 0;

  const formulaStr = `dx(1)/dt + (${a.toFixed(4)})x(1) = ${b.toFixed(2)}`;

  return {
    a: Number(a.toFixed(6)),
    b: Number(b.toFixed(4)),
    agoSequence: x1,
    predictedSequence,
    residuals,
    meanRelativeError: Number(meanRelativeError.toFixed(5)),
    isStable,
    lookaheadForecast,
    momentumDelta: Number(momentumDelta.toFixed(3)),
    formulaStr,
  };
}

/**
 * Provides step-by-step matrix derivation of GM(1,1) for transparency and interactive playground.
 */
export function executeGM11WithDiagnostics(
  rawSequence: number[],
  threshold: number = 0.02
): Gm11DetailedExecution {
  const result = calculateGM11(rawSequence, threshold);
  const n = rawSequence.length;

  const steps: GmDetailedStep[] = [
    {
      stepName: '1. Input Sequence x^(0)',
      formula: 'x^(0) = [x_1, x_2, ..., x_n]',
      resultSummary: `Received ${n} points: [${rawSequence.map((v) => v.toFixed(2)).join(', ')}]`,
      matrixData: rawSequence,
    },
    {
      stepName: '2. 1-AGO Accumulated Sequence x^(1)',
      formula: 'x^(1)(k) = \\sum_{i=1}^{k} x^(0)(i)',
      resultSummary: `Accumulated sum: [${result.agoSequence.map((v) => v.toFixed(2)).join(', ')}]`,
      matrixData: result.agoSequence,
    },
    {
      stepName: '3. Adjacent Neighbor Mean Sequence z^(1)',
      formula: 'z^(1)(k) = 0.5 * x^(1)(k) + 0.5 * x^(1)(k-1)',
      resultSummary: `Generated ${n - 1} mean values smoothing stochastic volatility`,
    },
    {
      stepName: '4. Parameter Estimation [a, u]^T via OLS',
      formula: '[a, u]^T = (B^T * B)^(-1) * B^T * Y',
      resultSummary: `Development coefficient a = ${result.a.toFixed(6)}, Grey action u = ${result.b.toFixed(4)}`,
      matrixData: { a: result.a, b: result.b },
    },
    {
      stepName: '5. Time Response Differential Solution',
      formula: '\\hat{x}^(1)(k+1) = (x^(0)(1) - u/a) * e^(-a*k) + u/a',
      resultSummary: result.formulaStr,
    },
    {
      stepName: '6. Noise Gate 1 Residual Evaluation (MRPE)',
      formula: 'MRPE = (1/n) * \\sum |(x^(0)(k) - \\hat{x}^(0)(k)) / x^(0)(k)|',
      resultSummary: `MRPE: ${(result.meanRelativeError * 100).toFixed(3)}% vs Threshold ${(threshold * 100).toFixed(1)}% -> ${
        result.isStable ? 'PASSED (Gate 1 Open)' : 'DISCARDED AS NOISE (Gate 1 Locked)'
      }`,
    },
    {
      stepName: '7. Look-Ahead Prediction (t+1, t+2, t+3)',
      formula: '\\hat{x}^(0)(k+1) = \\hat{x}^(1)(k+1) - \\hat{x}^(1)(k)',
      resultSummary: `t+1: ${result.lookaheadForecast[0].toFixed(2)} | t+2: ${result.lookaheadForecast[1].toFixed(2)} | t+3: ${result.lookaheadForecast[2].toFixed(2)} (Momentum: ${result.momentumDelta > 0 ? '+' : ''}${result.momentumDelta.toFixed(2)}%)`,
      matrixData: result.lookaheadForecast,
    },
  ];

  const pythonCode = `import numpy as np

def gm_1_1_predict(data, threshold=${threshold}):
    """
    Gate 1: Grey Model GM(1,1) Noise Filter & Look-Ahead Predictor
    data: list of last 5 float values from API feed
    threshold: maximum allowed MRPE error (default: ${threshold})
    """
    x0 = np.array(data, dtype=float)
    n = len(x0)
    if n < 4:
        raise ValueError("GM(1,1) requires >= 4 data points")
        
    # 1. Accumulated Generating Operation (1-AGO)
    x1 = np.cumsum(x0)
    
    # 2. Mean sequence generated of consecutive neighbors
    z1 = 0.5 * (x1[1:] + x1[:-1])
    
    # 3. Construct Data Matrix B and Vector Y
    B = np.vstack([-z1, np.ones(n - 1)]).T
    Y = x0[1:].reshape((n - 1, 1))
    
    # 4. Ordinary Least Squares parameter estimation
    # [a, u]^T = (B^T * B)^(-1) * B^T * Y
    BTB = np.dot(B.T, B)
    if np.linalg.det(BTB) == 0:
        return None, 1.0, False
    params = np.linalg.inv(BTB).dot(B.T).dot(Y)
    a, u = params[0, 0], params[1, 0]
    
    # 5. Continuous time response differential solution
    def x1_hat(k):
        return (x0[0] - u / a) * np.exp(-a * k) + u / a
        
    # 6. Fitted values & Inverse AGO
    x0_hat = np.zeros(n)
    x0_hat[0] = x0[0]
    for k in range(1, n):
        x0_hat[k] = x1_hat(k) - x1_hat(k - 1)
        
    # 7. Residual Mean Relative Percentage Error (MRPE)
    residuals = np.abs((x0 - x0_hat) / x0)
    mrpe = np.mean(residuals)
    is_stable = mrpe <= threshold
    
    # 8. Next Step Look-Ahead (k = n)
    next_step = x1_hat(n) - x1_hat(n - 1)
    
    return {
        "a": float(a),
        "u": float(u),
        "mrpe": float(mrpe),
        "is_stable": bool(is_stable),
        "prediction_t1": float(next_step),
        "fitted_series": x0_hat.tolist()
    }

# Test invocation:
data_sample = [${rawSequence.map((v) => v.toFixed(2)).join(', ')}]
result = gm_1_1_predict(data_sample)
print(result)
`;

  return {
    result,
    dataInput: rawSequence,
    threshold,
    passedGate1: result.isStable,
    steps,
    pythonCode,
  };
}

/**
 * Grey Relational Analysis (GRA) to find correlation between actual market movement
 * and individual API predictions, identifying "False Truths".
 * 
 * @param referenceSequence Array of actual price normalized changes
 * @param candidateSequences Map of apiId to normalized predicted array
 * @param rho Resolution coefficient (typically 0.5)
 */
export function calculateGRA(
  referenceSequence: number[],
  candidateSequences: Record<string, number[]>,
  rho: number = 0.5
): Record<string, number> {
  const N = referenceSequence.length;
  const apiIds = Object.keys(candidateSequences);

  if (N === 0 || apiIds.length === 0) return {};

  // Compute absolute differences Delta_0i(k)
  const diffs: Record<string, number[]> = {};
  let deltaMin = Infinity;
  let deltaMax = -Infinity;

  for (const id of apiIds) {
    const candidate = candidateSequences[id];
    diffs[id] = [];
    for (let k = 0; k < N; k++) {
      const actual = referenceSequence[k] || 0;
      const pred = candidate[k] || 0;
      const d = Math.abs(actual - pred);
      diffs[id].push(d);
      if (d < deltaMin) deltaMin = d;
      if (d > deltaMax) deltaMax = d;
    }
  }

  if (deltaMin === Infinity) deltaMin = 0;
  if (deltaMax === -Infinity || deltaMax === deltaMin) deltaMax = deltaMin + 1e-4;

  // Calculate Grey Relational Coefficient & Grade
  const relationalGrades: Record<string, number> = {};

  for (const id of apiIds) {
    let sumCoefficients = 0;
    for (let k = 0; k < N; k++) {
      const delta0i = diffs[id][k];
      const xi = (deltaMin + rho * deltaMax) / (delta0i + rho * deltaMax);
      sumCoefficients += xi;
    }
    relationalGrades[id] = sumCoefficients / N;
  }

  return relationalGrades;
}
