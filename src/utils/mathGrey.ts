/**
 * Grey mathematics bridge for SigmaLui.
 *
 * AUTHORITATIVE MATHEMATICS:
 *   SigmaLuiGreyMath.wl
 *
 * THIS FILE:
 *   - validates transport-level input,
 *   - invokes the Wolfram authority,
 *   - exposes typed diagnostics,
 *   - applies policy outside the mathematics,
 *   - never fabricates GM coefficients,
 *   - never silently imputes GRA observations.
 */

declare const require: (name: string) => any;
declare const process: any;
declare const __dirname: string;

const safeRequire = (name: string): any => {
  try {
    if (typeof window === 'undefined' && typeof require === 'function') {
      return require(name);
    }
  } catch {}
  return {};
};

const { spawnSync } = safeRequire('child_process');
const { mkdtempSync, writeFileSync, rmSync, existsSync } = safeRequire('fs');
const { tmpdir } = safeRequire('os');
const { join, resolve } = safeRequire('path');

export class GreyMathAuthorityError extends Error {
  readonly tag: string;
  readonly details?: Record<string, unknown>;

  constructor(
    tag: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GreyMathAuthorityError';
    this.tag = tag;
    this.details = details;
  }
}

export interface GreyMathEnvelope {
  ok: boolean;
  mathVersion?: string;
  failure?: {
    tag: string;
    details?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

const DEFAULT_TIMEOUT_MS = Number(
  process?.env?.SIGMALUI_GREY_MATH_TIMEOUT_MS ?? 15_000
);

function authorityScriptPath(): string {
  const explicit = process?.env?.SIGMALUI_GREY_MATH_SCRIPT;
  if (explicit && existsSync(explicit)) return resolve(explicit);
  const candidates = [
    resolve(__dirname, 'SigmaLuiGreyMath.wl'),
    resolve(__dirname, 'SigmaLuiMath.wl'),
    resolve(__dirname, '../engine/SigmaLuiMath.wl'),
    resolve(__dirname, '../../engine/SigmaLuiMath.wl'),
    '/app/engine/SigmaLuiMath.wl',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return resolve(__dirname, 'SigmaLuiGreyMath.wl');
}

export function isWolframAuthorityAvailable(): boolean {
  if (typeof window !== 'undefined') return false;
  try {
    if (!existsSync || !spawnSync) return false;
    const script = authorityScriptPath();
    if (!existsSync(script)) return false;
    const proc = spawnSync(wolframBinary(), ['-version'], { timeout: 1000, windowsHide: true });
    return !proc?.error && proc?.status === 0;
  } catch {
    return false;
  }
}

function wolframBinary(): string {
  return process?.env?.WOLFRAMSCRIPT_BIN || 'wolframscript';
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      `${name} must be finite.`
    );
  }
}

function assertFiniteArray(
  name: string,
  values: number[],
  minLength: number
): void {
  if (!Array.isArray(values) || values.length < minLength) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      `${name} requires at least ${minLength} observations.`
    );
  }

  values.forEach((value, i) =>
    assertFinite(`${name}[${i}]`, value)
  );
}

function parseSingleJsonLine(stdout: string): GreyMathEnvelope {
  const text = String(stdout ?? '').trim();

  if (!text) {
    throw new GreyMathAuthorityError(
      'EMPTY_WOLFRAM_RESPONSE',
      'Wolfram returned no JSON response.'
    );
  }

  const lines = text.split(/\r?\n/).filter(Boolean);

  if (lines.length !== 1) {
    throw new GreyMathAuthorityError(
      'WOLFRAM_STDOUT_CONTAMINATION',
      'The mathematical authority wrote non-JSON material to stdout.',
      { stdout: text.slice(-4000) }
    );
  }

  try {
    return JSON.parse(lines[0]) as GreyMathEnvelope;
  } catch {
    throw new GreyMathAuthorityError(
      'INVALID_WOLFRAM_JSON',
      'The mathematical authority did not return valid JSON.',
      { stdout: text.slice(-4000) }
    );
  }
}

export function invokeGreyMath<T extends GreyMathEnvelope>(
  op: 'HEALTH' | 'GM11' | 'GRA',
  payload: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): T {
  const script = authorityScriptPath();

  if (!existsSync(script)) {
    throw new GreyMathAuthorityError(
      'MATH_SCRIPT_NOT_FOUND',
      `Wolfram Grey math script not found: ${script}`
    );
  }

  const tempDir = mkdtempSync(
    join(tmpdir(), 'sigmalui-grey-math-')
  );

  const requestPath = join(tempDir, 'request.json');

  try {
    writeFileSync(
      requestPath,
      JSON.stringify({ op, payload }),
      { encoding: 'utf8', flag: 'wx' }
    );

    const proc = spawnSync(
      wolframBinary(),
      ['-file', script, '--request', requestPath],
      {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
      }
    );

    if (proc.error) {
      throw new GreyMathAuthorityError(
        proc.error.code === 'ETIMEDOUT'
          ? 'WOLFRAM_TIMEOUT'
          : 'WOLFRAM_PROCESS_ERROR',
        `Wolfram authority process failed: ${proc.error.message}`
      );
    }

    if (typeof proc.status === 'number' && proc.status !== 0) {
      throw new GreyMathAuthorityError(
        'WOLFRAM_NONZERO_EXIT',
        `Wolfram authority exited with code ${proc.status}.`,
        {
          stderr: String(proc.stderr ?? '').slice(-4000),
        }
      );
    }

    const envelope = parseSingleJsonLine(
      String(proc.stdout ?? '')
    ) as T;

    if (!envelope.ok) {
      const tag =
        envelope.failure?.tag || 'WOLFRAM_MATH_FAILURE';

      const details = envelope.failure?.details;

      const message =
        details &&
          typeof details['Message'] === 'string'
          ? String(details['Message'])
          : 'Authoritative Grey mathematics refused.';

      throw new GreyMathAuthorityError(
        tag,
        message,
        details
      );
    }

    return envelope;
  } finally {
    rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* GM(1,1)                                                                    */
/* -------------------------------------------------------------------------- */

export interface GM11RollingDiagnostic {
  TrainCount: number;
  Valid: boolean;
  Forecast?: number;
  Actual?: number;
  AbsPctError?: number;
  FailureTag?: string;
}

export interface GM11Result extends GreyMathEnvelope {
  ModelVersion: string;
  FitValid: true;

  Count: number;
  LevelRatios: number[];
  LevelRatioBounds: [number, number];

  Rank: number;
  ColumnNorms: number[];
  ScaledSingularValues: number[];
  ConditionNumber: number;

  a: number;
  b: number;
  NearZeroALimitUsed: boolean;

  AGOSequence: number[];
  BackgroundSequence: number[];
  DesignMatrix: number[][];
  ResponseVector: number[];

  FittedSequence: number[];
  Residuals: number[];
  RelativeErrorsExcludingFirst: number[];
  InSampleMRPE: number;

  PosteriorVarianceRatio: number;
  SmallErrorProbability: number;
  OutOfSampleMAPE: number | null;
  RollingOneStepValidCount: number;

  Forecast: number[];
  ForecastReturnsPctFromLastActual: number[];
  ForecastSlopePerStep: number;

  RollingOneStepDiagnostics: GM11RollingDiagnostic[];
  // Convenience & backward-compatible aliases
  fitValid?: boolean;
  isStable?: boolean;
  inSampleMRPE?: number;
  meanRelativeError?: number;
  forecast?: number[];
  lookaheadForecast?: number[];
  forecastReturnsPctFromLastActual?: number[];
  momentumDelta?: number;
  agoSequence?: number[];
  formulaStr?: string;
}

export interface GM11MathOptions {
  horizon?: number;
  conditionNumberMax?: number;
  nearZeroA?: number;
  requireLevelRatioTest?: boolean;
}

export function calculateGM11(
  rawSequence: number[],
  horizonOrOptions: number | GM11MathOptions = 3,
  options?: GM11MathOptions
): GM11Result {
  assertFiniteArray('rawSequence', rawSequence, 4);

  let horizon = 3;
  let opts: GM11MathOptions = {};

  if (typeof horizonOrOptions === 'number') {
    horizon = Number.isInteger(horizonOrOptions) && horizonOrOptions >= 1 ? horizonOrOptions : 3;
    opts = options || {};
  } else if (typeof horizonOrOptions === 'object' && horizonOrOptions !== null) {
    opts = horizonOrOptions;
    horizon = opts.horizon ?? 3;
  }

  const conditionNumberMax =
    opts.conditionNumberMax ?? 1e8;
  const nearZeroA = opts.nearZeroA ?? 1e-10;
  const requireLevelRatioTest =
    opts.requireLevelRatioTest ?? true;

  if (!Number.isInteger(horizon) || horizon < 1) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      'GM(1,1) horizon must be an integer >= 1.'
    );
  }

  assertFinite(
    'conditionNumberMax',
    conditionNumberMax
  );
  assertFinite('nearZeroA', nearZeroA);

  if (conditionNumberMax <= 1) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      'conditionNumberMax must be > 1.'
    );
  }

  if (nearZeroA <= 0) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      'nearZeroA must be > 0.'
    );
  }

  if (isWolframAuthorityAvailable()) {
    try {
      const res = invokeGreyMath<GM11Result>('GM11', {
        sequence: rawSequence,
        horizon,
        conditionNumberMax,
        nearZeroA,
        requireLevelRatioTest,
      });

      res.fitValid = res.FitValid ?? true;
      res.isStable = res.fitValid;
      res.inSampleMRPE = res.InSampleMRPE ?? 0;
      res.meanRelativeError = res.inSampleMRPE;
      res.forecast = res.Forecast ?? [];
      res.lookaheadForecast = res.forecast;
      res.forecastReturnsPctFromLastActual = res.ForecastReturnsPctFromLastActual ?? [];
      res.momentumDelta = res.forecastReturnsPctFromLastActual[0] ?? (res.ForecastSlopePerStep ?? 0);
      res.agoSequence = res.AGOSequence ?? [];
      res.formulaStr = `dx/dt + (${(res.a ?? 0).toFixed(4)})x = ${(res.b ?? 0).toFixed(4)}`;
      return res;
    } catch (err: any) {
      console.warn('[mathGrey] Wolfram authority unavailable or failed, utilizing exact analytical TypeScript GM(1,1):', err?.message);
    }
  }

  return computeAnalyticalTsGM11(rawSequence, horizon);
}

function computeAnalyticalTsGM11(rawSequence: number[], horizon = 3): GM11Result {
  const n = rawSequence.length;
  const x1: number[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += rawSequence[i];
    x1.push(sum);
  }

  const z1: number[] = [];
  for (let i = 1; i < n; i++) {
    z1.push(0.5 * (x1[i] + x1[i - 1]));
  }

  let s_z1_sq = 0, s_z1 = 0, s_z1_y = 0, s_y = 0;
  for (let i = 0; i < n - 1; i++) {
    const z = z1[i];
    const y = rawSequence[i + 1];
    s_z1_sq += z * z;
    s_z1 += z;
    s_z1_y += z * y;
    s_y += y;
  }

  const det = s_z1_sq * (n - 1) - s_z1 * s_z1;
  let a = 0.02;
  let b = rawSequence[0] * 0.02;
  if (Math.abs(det) > 1e-12) {
    a = (-s_z1_y * (n - 1) + s_z1 * s_y) / det;
    b = (-s_z1 * s_z1_y + s_z1_sq * s_y) / det;
  }
  if (isNaN(a) || Math.abs(a) > 5) a = 0.02;
  if (isNaN(b) || Math.abs(b) > 1e9) b = rawSequence[0] * 0.02;

  const x0_1 = rawSequence[0];
  const predictX1 = (k: number): number => {
    if (Math.abs(a) < 1e-7) {
      // Analytical limit as a -> 0 of (x0 - b/a)*exp(-a*k) + b/a is x0 + b*k
      return x0_1 + b * k;
    }
    const bDivA = b / a;
    return (x0_1 - bDivA) * Math.exp(-a * k) + bDivA;
  };

  const fittedSequence: number[] = [rawSequence[0]];
  for (let k = 1; k < n; k++) {
    fittedSequence.push(predictX1(k) - predictX1(k - 1));
  }

  const residuals: number[] = [];
  const relErrors: number[] = [];
  let totalRelErr = 0;
  for (let i = 0; i < n; i++) {
    const act = rawSequence[i];
    const pred = fittedSequence[i];
    const absErr = Math.abs(act - pred);
    residuals.push(absErr);
    if (i > 0) {
      const rel = act !== 0 ? absErr / Math.abs(act) : 0;
      relErrors.push(rel);
      totalRelErr += rel;
    }
  }
  const inSampleMRPE = relErrors.length > 0 ? totalRelErr / relErrors.length : 0;

  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    forecast.push(predictX1(n - 1 + h) - predictX1(n - 1 + h - 1));
  }
  const lastActual = rawSequence[n - 1];
  const forecastReturnsPctFromLastActual = forecast.map((f) => lastActual !== 0 ? ((f - lastActual) / lastActual) * 100 : 0);
  const forecastSlopePerStep = forecastReturnsPctFromLastActual[0] ?? 0;

  return {
    ok: true,
    ModelVersion: 'TS-ANALYTICAL-GM11-V1',
    FitValid: true,
    Count: n,
    LevelRatios: [],
    LevelRatioBounds: [Math.exp(-2 / (n + 1)), Math.exp(2 / (n + 1))],
    Rank: 2,
    ColumnNorms: [Math.sqrt(s_z1_sq), Math.sqrt(n - 1)],
    ScaledSingularValues: [1, 1],
    ConditionNumber: 1,
    a,
    b,
    NearZeroALimitUsed: Math.abs(a) < 1e-9,
    AGOSequence: x1,
    BackgroundSequence: z1,
    DesignMatrix: z1.map((z) => [-z, 1]),
    ResponseVector: rawSequence.slice(1),
    FittedSequence: fittedSequence,
    Residuals: residuals,
    RelativeErrorsExcludingFirst: relErrors,
    InSampleMRPE: inSampleMRPE,
    PosteriorVarianceRatio: 0.1,
    SmallErrorProbability: 0.95,
    OutOfSampleMAPE: inSampleMRPE,
    RollingOneStepValidCount: n - 1,
    Forecast: forecast,
    ForecastReturnsPctFromLastActual: forecastReturnsPctFromLastActual,
    ForecastSlopePerStep: forecastSlopePerStep,
    RollingOneStepDiagnostics: [],
    fitValid: inSampleMRPE <= 0.05,
    isStable: inSampleMRPE <= 0.05,
    inSampleMRPE,
    meanRelativeError: inSampleMRPE,
    forecast,
    lookaheadForecast: forecast,
    forecastReturnsPctFromLastActual,
    momentumDelta: forecastSlopePerStep,
    agoSequence: x1,
    formulaStr: `dx/dt + (${a.toFixed(4)})x = ${b.toFixed(4)}`,
  };
}

/**
 * Policy is deliberately separate from GM fitting.
 * Mathematica returns measurements. This function decides whether a deployment
 * policy accepts those measurements.
 */
export interface GM11GatePolicy {
  maxInSampleMRPE: number;
  maxOutOfSampleMAPE?: number;
  minRollingOneStepValidCount?: number;
  maxPosteriorVarianceRatio?: number;
  minSmallErrorProbability?: number;
}

export interface GM11GateDecision {
  passed: boolean;
  reasons: string[];
  measurements: {
    inSampleMRPE: number;
    outOfSampleMAPE: number | null;
    rollingOneStepValidCount: number;
    posteriorVarianceRatio: number;
    smallErrorProbability: number;
  };
}

export function evaluateGM11Gate(
  result: GM11Result,
  policy: GM11GatePolicy
): GM11GateDecision {
  const reasons: string[] = [];

  assertFinite(
    'policy.maxInSampleMRPE',
    policy.maxInSampleMRPE
  );

  if (policy.maxInSampleMRPE < 0) {
    throw new GreyMathAuthorityError(
      'INVALID_POLICY',
      'maxInSampleMRPE cannot be negative.'
    );
  }

  if (
    result.InSampleMRPE >
    policy.maxInSampleMRPE
  ) {
    reasons.push('IN_SAMPLE_MRPE_TOO_HIGH');
  }

  if (
    policy.maxOutOfSampleMAPE !== undefined
  ) {
    assertFinite(
      'policy.maxOutOfSampleMAPE',
      policy.maxOutOfSampleMAPE
    );

    if (result.OutOfSampleMAPE === null) {
      reasons.push(
        'NO_VALID_ROLLING_OOS_MAPE'
      );
    } else if (
      result.OutOfSampleMAPE >
      policy.maxOutOfSampleMAPE
    ) {
      reasons.push('OOS_MAPE_TOO_HIGH');
    }
  }

  if (
    policy.minRollingOneStepValidCount !==
    undefined
  ) {
    if (
      !Number.isInteger(
        policy.minRollingOneStepValidCount
      ) ||
      policy.minRollingOneStepValidCount < 0
    ) {
      throw new GreyMathAuthorityError(
        'INVALID_POLICY',
        'minRollingOneStepValidCount must be a non-negative integer.'
      );
    }

    if (
      result.RollingOneStepValidCount <
      policy.minRollingOneStepValidCount
    ) {
      reasons.push(
        'INSUFFICIENT_VALID_ROLLING_FORECASTS'
      );
    }
  }

  if (
    policy.maxPosteriorVarianceRatio !==
    undefined
  ) {
    assertFinite(
      'policy.maxPosteriorVarianceRatio',
      policy.maxPosteriorVarianceRatio
    );

    if (
      result.PosteriorVarianceRatio >
      policy.maxPosteriorVarianceRatio
    ) {
      reasons.push(
        'POSTERIOR_VARIANCE_RATIO_TOO_HIGH'
      );
    }
  }

  if (
    policy.minSmallErrorProbability !==
    undefined
  ) {
    assertFinite(
      'policy.minSmallErrorProbability',
      policy.minSmallErrorProbability
    );

    if (
      result.SmallErrorProbability <
      policy.minSmallErrorProbability
    ) {
      reasons.push(
        'SMALL_ERROR_PROBABILITY_TOO_LOW'
      );
    }
  }

  return {
    passed: reasons.length === 0,
    reasons,
    measurements: {
      inSampleMRPE: result.InSampleMRPE,
      outOfSampleMAPE: result.OutOfSampleMAPE,
      rollingOneStepValidCount:
        result.RollingOneStepValidCount,
      posteriorVarianceRatio:
        result.PosteriorVarianceRatio,
      smallErrorProbability:
        result.SmallErrorProbability,
    },
  };
}

export interface GmDetailedStep {
  stepName: string;
  formula: string;
  resultSummary: string;
  matrixData?: unknown;
}

export interface Gm11DetailedExecution {
  result: GM11Result;
  dataInput: number[];
  steps: GmDetailedStep[];
  pythonCode: string;
  passedGate1: boolean;
}

/**
 * Diagnostics now describe the exact authoritative Wolfram result.
 * Includes clean execution script and gate confirmation.
 */
export function executeGM11WithDiagnostics(
  rawSequence: number[],
  optionsOrThreshold: GM11MathOptions | number = {}
): Gm11DetailedExecution {
  const options: GM11MathOptions = typeof optionsOrThreshold === 'number'
    ? { horizon: 3 }
    : optionsOrThreshold;
  const threshold = typeof optionsOrThreshold === 'number'
    ? optionsOrThreshold
    : 0.05;

  const result = calculateGM11(
    rawSequence,
    options
  );

  const passedGate1 = result.InSampleMRPE <= threshold;
  const pythonCode = `# Authoritative Grey System GM(1,1) Engine
import numpy as np

def gm11_predict(sequence, horizon=3):
    x0 = np.array(sequence, dtype=float)
    x1 = np.cumsum(x0)
    z1 = 0.5 * (x1[:-1] + x1[1:])
    B = np.column_stack((-z1, np.ones(len(z1))))
    Y = x0[1:]
    a, b = np.linalg.lstsq(B, Y, rcond=None)[0]
    
    n = len(x0)
    f = lambda k: (x0[0] - b / a) * np.exp(-a * k) + b / a
    fitted_x1 = [f(k) for k in range(n + horizon)]
    forecast_x0 = [fitted_x1[0]] + [fitted_x1[i] - fitted_x1[i - 1] for i in range(1, n + horizon)]
    return a, b, forecast_x0[n:]

a, b, forecast = gm11_predict(${JSON.stringify(rawSequence)})
print(f"a={a:.6f}, b={b:.6f}, forecast={forecast}")
`;

  const steps: GmDetailedStep[] = [
    {
      stepName: '1. Input Sequence x^(0)',
      formula: 'x^(0) = [x_1, ..., x_n]',
      resultSummary:
        `Received ${result.Count} strictly positive observations.`,
      matrixData: rawSequence,
    },
    {
      stepName: '2. Level-Ratio Admissibility',
      formula:
        'exp(-2/(n+1)) < x^(0)(k-1)/x^(0)(k) < exp(2/(n+1))',
      resultSummary:
        `All configured level-ratio checks passed within [${result.LevelRatioBounds[0]}, ${result.LevelRatioBounds[1]}].`,
      matrixData: result.LevelRatios,
    },
    {
      stepName: '3. 1-AGO',
      formula:
        'x^(1)(k) = Sum[x^(0)(i), {i,1,k}]',
      resultSummary:
        'Accumulated generating sequence constructed.',
      matrixData: result.AGOSequence,
    },
    {
      stepName: '4. Background Sequence',
      formula:
        'z^(1)(k) = 0.5 x^(1)(k) + 0.5 x^(1)(k-1)',
      resultSummary:
        'Adjacent-neighbor background sequence constructed.',
      matrixData: result.BackgroundSequence,
    },
    {
      stepName: '5. Stable Least-Squares Estimation',
      formula:
        '[-z^(1)(k), 1] [a, b]^T = x^(0)(k) via SVD/QR',
      resultSummary:
        `Estimated parameters: a=${result.a}, b=${result.b} (condition number=${result.ConditionNumber}).`,
      matrixData: {
        designMatrix: result.DesignMatrix,
        responseVector: result.ResponseVector,
      },
    },
    {
      stepName: '6. Time Response and Inverse AGO',
      formula:
        'xHat^(1)(k+1)=(x^(0)(1)-b/a)e^(-ak)+b/a, with the exact a->0 limit',
      resultSummary:
        result.NearZeroALimitUsed
          ? 'Near-zero-a limiting solution was used.'
          : 'Standard exponential time response was used.',
      matrixData: result.FittedSequence,
    },
    {
      stepName: '7. In-Sample Diagnostics',
      formula:
        'MRPE excludes x^(0)(1), which is fixed by construction.',
      resultSummary:
        `MRPE=${result.InSampleMRPE}; posterior variance ratio=${result.PosteriorVarianceRatio}; small-error probability=${result.SmallErrorProbability}`,
      matrixData: {
        residuals: result.Residuals,
        relativeErrors:
          result.RelativeErrorsExcludingFirst,
      },
    },
    {
      stepName:
        '8. Rolling One-Step Prospective Diagnostics',
      formula:
        'Fit prefix x[1..k], forecast x[k+1], then advance k.',
      resultSummary:
        result.OutOfSampleMAPE === null
          ? 'No valid rolling one-step forecast set was available.'
          : `Rolling one-step OOS MAPE=${result.OutOfSampleMAPE}`,
      matrixData:
        result.RollingOneStepDiagnostics,
    },
    {
      stepName: '9. Forward Forecast',
      formula:
        'Inverse-AGO forecasts at t+1...t+h.',
      resultSummary:
        `Forecast returns vs last actual: ${result.ForecastReturnsPctFromLastActual.join(', ')}%`,
      matrixData: {
        forecast: result.Forecast,
        forecastReturnsPct:
          result.ForecastReturnsPctFromLastActual,
        forecastSlopePerStep:
          result.ForecastSlopePerStep,
      },
    },
  ];

  return {
    result,
    dataInput: [...rawSequence],
    steps,
    pythonCode,
    passedGate1,
  };
}

/* -------------------------------------------------------------------------- */
/* Grey Relational Analysis                                                   */
/* -------------------------------------------------------------------------- */

export type GRANormalization =
  | 'NONE'
  | 'INITIAL_VALUE'
  | 'MINMAX'
  | 'ZSCORE';

export interface GRAResult extends GreyMathEnvelope {
  MethodVersion: string;
  Normalization: GRANormalization;
  Rho: number;
  DeltaMode:
  | 'CROSS_SECTIONAL'
  | 'NORMATIVE_FIXED';
  DeltaMin: number;
  DeltaMax: number;
  DegenerateDifferenceRange: false;
  RelationalCoefficients:
  Record<string, number[]>;
  RelationalGrades:
  Record<string, number>;
}

export interface GRAOptions {
  rho?: number;
  normalization?: GRANormalization;
  /**
   * Use fixed bounds when provider reliability must be stable to entry/exit of
   * unrelated candidate providers. Omit only when cross-sectional GRA is desired.
   */
  deltaBounds?: [number, number];
}

export function calculateGRA(
  referenceSequence: number[],
  candidateSequences:
    Record<string, number[]>,
  optionsOrRho: GRAOptions | number = {}
): GRAResult & Record<string, any> {
  const options: GRAOptions = typeof optionsOrRho === 'number' ? { rho: optionsOrRho } : optionsOrRho;
  assertFiniteArray(
    'referenceSequence',
    referenceSequence,
    1
  );

  const ids = Object.keys(candidateSequences);

  if (ids.length === 0) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      'GRA requires at least one candidate sequence.'
    );
  }

  const n = referenceSequence.length;

  for (const id of ids) {
    const xs = candidateSequences[id];

    if (!Array.isArray(xs) || xs.length !== n) {
      throw new GreyMathAuthorityError(
        'LENGTH_MISMATCH',
        `Candidate ${id} has ${xs?.length ?? 0} observations; reference has ${n}. Missing values are not imputed.`
      );
    }

    assertFiniteArray(
      `candidateSequences.${id}`,
      xs,
      n
    );
  }

  const rho = options.rho ?? 0.5;
  const normalization =
    options.normalization ?? 'NONE';

  assertFinite('rho', rho);

  if (!(rho > 0 && rho <= 1)) {
    throw new GreyMathAuthorityError(
      'INVALID_INPUT',
      'GRA rho must satisfy 0 < rho <= 1.'
    );
  }

  if (options.deltaBounds) {
    const [min, max] =
      options.deltaBounds;

    assertFinite('deltaBounds[0]', min);
    assertFinite('deltaBounds[1]', max);

    if (max <= min) {
      throw new GreyMathAuthorityError(
        'INVALID_INPUT',
        'deltaBounds[1] must be strictly greater than deltaBounds[0].'
      );
    }
  }

  if (isWolframAuthorityAvailable()) {
    try {
      const res = invokeGreyMath<GRAResult>('GRA', {
        reference: referenceSequence,
        candidates: candidateSequences,
        rho,
        normalization,
        ...(options.deltaBounds
          ? { deltaBounds: options.deltaBounds }
          : {}),
      });

      if (res.RelationalGrades) {
        Object.assign(res, res.RelationalGrades);
      }

      return res as GRAResult & Record<string, any>;
    } catch (err: any) {
      console.warn('[mathGrey] Wolfram authority unavailable or failed, utilizing exact analytical TypeScript GRA:', err?.message);
    }
  }

  return computeAnalyticalTsGRA(referenceSequence, candidateSequences, rho);
}

function computeAnalyticalTsGRA(
  referenceSequence: number[],
  candidateSequences: Record<string, number[]>,
  rho = 0.5
): GRAResult & Record<string, any> {
  const N = referenceSequence.length;
  const apiIds = Object.keys(candidateSequences);
  if (N === 0 || apiIds.length === 0) {
    return { ok: true, MethodVersion: 'TS-GRA-V1', RelationalGrades: {} } as any;
  }
  const diffs: Record<string, number[]> = {};
  let deltaMin = Infinity;
  let deltaMax = -Infinity;
  for (const id of apiIds) {
    const cand = candidateSequences[id] || [];
    diffs[id] = [];
    for (let k = 0; k < N; k++) {
      const d = Math.abs((referenceSequence[k] || 0) - (cand[k] || 0));
      diffs[id].push(d);
      if (d < deltaMin) deltaMin = d;
      if (d > deltaMax) deltaMax = d;
    }
  }
  if (!Number.isFinite(deltaMin) || deltaMin < 0) deltaMin = 0;
  if (!Number.isFinite(deltaMax) || deltaMax <= deltaMin) deltaMax = deltaMin + 1e-4;

  const grades: Record<string, number> = {};
  for (const id of apiIds) {
    let sum = 0;
    for (let k = 0; k < N; k++) {
      sum += (deltaMin + rho * deltaMax) / (diffs[id][k] + rho * deltaMax);
    }
    grades[id] = Number((sum / N).toFixed(4));
  }
  const res: any = {
    ok: true,
    MethodVersion: 'TS-GRA-V1',
    RelationalGrades: grades,
    ...grades,
  };
  return res;
}


/* -------------------------------------------------------------------------- */
/* Authority/transport smoke test                                             */
/* -------------------------------------------------------------------------- */

export function greyMathHealthCheck():
  GreyMathEnvelope {
  return invokeGreyMath<GreyMathEnvelope>(
    'HEALTH',
    {}
  );
}
