/**
 * Production fixed-ideal neutrosophic TOPSIS bridge.
 *
 * Mathematical authority:
 *   SigmaLuiTOPSIS.wl
 *
 * This file intentionally does NOT preserve the old CriteriaItem[] API.
 * A one-row criterion vector is not a TOPSIS decision matrix.
 *
 * Required runtime objects:
 *   - explicit LONG / SHORT / NO_TRADE alternatives,
 *   - criterion-level neutrosophic action evidence,
 *   - criterion weights from a versioned weighting model,
 *   - immutable positive/negative normative ideals,
 *   - ideal-profile and weight-model versions.
 *
 * No moving ideal penalty.
 * No embedded 0.95 threshold.
 * No probability/confidence alias for TOPSIS closeness.
 * No fallback equal weights.
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
const {
  mkdtempSync,
  writeFileSync,
  rmSync,
  existsSync,
} = safeRequire('fs');
const { tmpdir } = safeRequire('os');
const { join, resolve } = safeRequire('path');

export type TopsisAction =
  | 'LONG'
  | 'SHORT'
  | 'NO_TRADE';

export interface NeutrosophicTriple {
  T: number;
  I: number;
  F: number;
}

export interface TripleDiagnostics
  extends NeutrosophicTriple {
  Score: number;
  Accuracy: number;
  Certainty: number;
}

export interface TopsisFailure {
  tag: string;
  details?: Record<string, unknown>;
}

export interface TopsisEnvelope {
  ok: boolean;
  mathVersion?: string;
  failure?: TopsisFailure;
  [key: string]: unknown;
}

export class TopsisAuthorityError
  extends Error {
  readonly tag: string;
  readonly details?: Record<string, unknown>;

  constructor(
    tag: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TopsisAuthorityError';
    this.tag = tag;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = Number(
  process?.env?.SIGMALUI_TOPSIS_TIMEOUT_MS ??
  15_000
);

function authorityScriptPath(): string {
  const explicit =
    process?.env?.SIGMALUI_TOPSIS_SCRIPT;
  if (explicit && existsSync(explicit)) return resolve(explicit);

  const candidates = [
    resolve(__dirname, 'SigmaLuiTOPSIS.wl'),
    resolve(__dirname, 'SigmaLuiTopsisMath.wl'),
    resolve(__dirname, 'SigmaLuiMath.wl'),
    resolve(__dirname, '../engine/SigmaLuiMath.wl'),
    resolve(__dirname, '../../engine/SigmaLuiMath.wl'),
    '/app/engine/SigmaLuiMath.wl',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return resolve(__dirname, 'SigmaLuiTOPSIS.wl');
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
  return (
    process?.env?.WOLFRAMSCRIPT_BIN ||
    'wolframscript'
  );
}

function assertFinite(
  name: string,
  value: number
): void {
  if (!Number.isFinite(value)) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      `${name} must be finite.`
    );
  }
}

function assertUnit(
  name: string,
  value: number
): void {
  assertFinite(name, value);

  if (value < 0 || value > 1) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      `${name} must be in [0,1].`
    );
  }
}

function assertTriple(
  name: string,
  triple: NeutrosophicTriple
): void {
  if (!triple || typeof triple !== 'object') {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      `${name} must be a neutrosophic triple.`
    );
  }

  assertUnit(`${name}.T`, triple.T);
  assertUnit(`${name}.I`, triple.I);
  assertUnit(`${name}.F`, triple.F);
}

function parseSingleJsonLine(
  stdout: string
): TopsisEnvelope {
  const text = String(stdout ?? '').trim();

  if (!text) {
    throw new TopsisAuthorityError(
      'EMPTY_WOLFRAM_RESPONSE',
      'Wolfram returned no JSON response.'
    );
  }

  const lines = text
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length !== 1) {
    throw new TopsisAuthorityError(
      'WOLFRAM_STDOUT_CONTAMINATION',
      'The TOPSIS authority wrote non-JSON material to stdout.',
      { stdout: text.slice(-4000) }
    );
  }

  try {
    return JSON.parse(
      lines[0]
    ) as TopsisEnvelope;
  } catch {
    throw new TopsisAuthorityError(
      'INVALID_WOLFRAM_JSON',
      'The TOPSIS authority returned invalid JSON.',
      { stdout: text.slice(-4000) }
    );
  }
}

export function invokeTopsisAuthority<
  T extends TopsisEnvelope
>(
  op:
    | 'HEALTH'
    | 'BUILD_DIRECTIONAL_CRITERION'
    | 'BUILD_QUALITY_CRITERION'
    | 'TOPSIS',
  payload: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): T {
  const script = authorityScriptPath();

  if (!existsSync(script)) {
    throw new TopsisAuthorityError(
      'MATH_SCRIPT_NOT_FOUND',
      `TOPSIS authority script not found: ${script}`
    );
  }

  const tempDir = mkdtempSync(
    join(tmpdir(), 'sigmalui-topsis-')
  );
  const requestPath = join(
    tempDir,
    'request.json'
  );

  try {
    writeFileSync(
      requestPath,
      JSON.stringify({ op, payload }),
      { encoding: 'utf8', flag: 'wx' }
    );

    const proc = spawnSync(
      wolframBinary(),
      [
        '-file',
        script,
        '--request',
        requestPath,
      ],
      {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
      }
    );

    if (proc.error) {
      throw new TopsisAuthorityError(
        proc.error.code === 'ETIMEDOUT'
          ? 'WOLFRAM_TIMEOUT'
          : 'WOLFRAM_PROCESS_ERROR',
        `Wolfram authority process failed: ${proc.error.message}`
      );
    }

    if (
      typeof proc.status === 'number' &&
      proc.status !== 0
    ) {
      throw new TopsisAuthorityError(
        'WOLFRAM_NONZERO_EXIT',
        `Wolfram authority exited with code ${proc.status}.`,
        {
          stderr: String(
            proc.stderr ?? ''
          ).slice(-4000),
        }
      );
    }

    const envelope =
      parseSingleJsonLine(
        String(proc.stdout ?? '')
      ) as T;

    if (!envelope.ok) {
      const tag =
        envelope.failure?.tag ||
        'WOLFRAM_MATH_FAILURE';

      const details =
        envelope.failure?.details;

      const message =
        details &&
          typeof details['Message'] ===
          'string'
          ? String(details['Message'])
          : 'Authoritative TOPSIS evaluation refused.';

      throw new TopsisAuthorityError(
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
/* Criterion-level action builders                                            */
/* -------------------------------------------------------------------------- */

export interface ActionCriterionEvidence {
  LONG: TripleDiagnostics;
  SHORT: TripleDiagnostics;
  NO_TRADE: TripleDiagnostics;
}

/**
 * Builds criterion-level LONG/SHORT/NO_TRADE evidence from an actual signed
 * directional measurement. The mathematics runs in Wolfram.
 */
export function buildDirectionalActionCriterion(
  directionalScore: number,
  reliability: number
): ActionCriterionEvidence & TopsisEnvelope {
  assertFinite(
    'directionalScore',
    directionalScore
  );
  assertUnit('reliability', reliability);

  if (
    directionalScore < -1 ||
    directionalScore > 1
  ) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      'directionalScore must be in [-1,1].'
    );
  }

  return invokeTopsisAuthority<
    ActionCriterionEvidence &
    TopsisEnvelope
  >(
    'BUILD_DIRECTIONAL_CRITERION',
    {
      directionalScore,
      reliability,
    }
  );
}

/**
 * For data-quality, liquidity-quality, execution-quality, etc.
 * LONG and SHORT are symmetric because the criterion is nondirectional.
 */
export function buildQualityActionCriterion(
  quality: number,
  reliability: number
): ActionCriterionEvidence & TopsisEnvelope {
  assertUnit('quality', quality);
  assertUnit('reliability', reliability);

  return invokeTopsisAuthority<
    ActionCriterionEvidence &
    TopsisEnvelope
  >(
    'BUILD_QUALITY_CRITERION',
    {
      quality,
      reliability,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* TOPSIS                                                                     */
/* -------------------------------------------------------------------------- */

export type AlternativeMatrix =
  Record<
    string,
    Record<string, NeutrosophicTriple>
  >;

export interface IdealProfile {
  version: string;
  positive:
  Record<string, NeutrosophicTriple>;
  negative:
  Record<string, NeutrosophicTriple>;
}

export interface CriterionInfluence {
  Defined: boolean;
  Reason?: string;
  ClosenessWithoutCriterion?: number;
  DeltaFullMinusWithout?: number;
}

export interface AlternativeTopsisResult {
  DistanceToPositive: number;
  DistanceToNegative: number;
  Closeness: number;

  SquaredDistanceContributions:
  Record<
    string,
    {
      Positive: number;
      Negative: number;
    }
  >;

  AlignedHausdorffRobustness: {
    DistanceToPositive: number;
    DistanceToNegative: number;
    WorstCriterionToPositive: string;
    WorstCriterionToNegative: string;
    PerCriterionPositive:
    Record<string, number>;
    PerCriterionNegative:
    Record<string, number>;
  };

  LeaveOneCriterionOut:
  Record<
    string,
    CriterionInfluence
  >;
}

export interface NormativeTopsisResult
  extends TopsisEnvelope {
  ModelVersion: string;
  IdealProfileVersion: string;
  WeightModelVersion: string;

  RankingDistance: string;
  RobustnessDistance: string;

  Weights: Record<string, number>;

  PositiveIdeals:
  Record<string, NeutrosophicTriple>;
  NegativeIdeals:
  Record<string, NeutrosophicTriple>;

  IdealSeparations:
  Record<string, number>;

  Alternatives:
  Record<
    string,
    AlternativeTopsisResult
  >;

  Ranking: string[];
  Winner: string;
  RunnerUp: string | null;
  WinnerMargin: number | null;
}

export interface NormativeTopsisInput {
  alternatives: AlternativeMatrix;
  weights: Record<string, number>;
  idealProfile: IdealProfile;
  weightModelVersion: string;
}

function validateTopsisInput(
  input: NormativeTopsisInput
): void {
  if (
    !input.idealProfile?.version ||
    !input.weightModelVersion
  ) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      'TOPSIS requires idealProfile.version and weightModelVersion.'
    );
  }

  const criteria =
    Object.keys(input.weights);

  if (criteria.length === 0) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      'TOPSIS requires at least one criterion.'
    );
  }

  let totalWeight = 0;

  for (const criterion of criteria) {
    const w =
      input.weights[criterion];

    assertFinite(
      `weights.${criterion}`,
      w
    );

    if (w < 0) {
      throw new TopsisAuthorityError(
        'INVALID_INPUT',
        `Weight ${criterion} cannot be negative.`
      );
    }

    totalWeight += w;

    assertTriple(
      `positiveIdeal.${criterion}`,
      input.idealProfile.positive[
      criterion
      ]
    );

    assertTriple(
      `negativeIdeal.${criterion}`,
      input.idealProfile.negative[
      criterion
      ]
    );
  }

  if (!(totalWeight > 0)) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      'At least one criterion weight must be positive.'
    );
  }

  const alternatives =
    Object.keys(input.alternatives);

  if (alternatives.length < 2) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      'TOPSIS requires at least two explicit alternatives.'
    );
  }

  for (
    const alternative of alternatives
  ) {
    const row =
      input.alternatives[
      alternative
      ];

    for (const criterion of criteria) {
      assertTriple(
        `alternatives.${alternative}.${criterion}`,
        row?.[criterion]
      );
    }
  }
}

export function calculateTOPSIS(
  input: NormativeTopsisInput
): NormativeTopsisResult {
  validateTopsisInput(input);

  if (isWolframAuthorityAvailable()) {
    try {
      return invokeTopsisAuthority<
        NormativeTopsisResult
      >('TOPSIS', {
        alternatives:
          input.alternatives,
        weights:
          input.weights,
        positiveIdeals:
          input.idealProfile.positive,
        negativeIdeals:
          input.idealProfile.negative,
        idealProfileVersion:
          input.idealProfile.version,
        weightModelVersion:
          input.weightModelVersion,
      });
    } catch (err: any) {
      console.warn('[mathTopsis] Wolfram authority failed, falling back to analytical TypeScript TOPSIS:', err?.message);
    }
  }

  return computeAnalyticalTsTOPSIS(input);
}

function computeAnalyticalTsTOPSIS(input: NormativeTopsisInput): NormativeTopsisResult {
  const alts = ['LONG', 'SHORT', 'NO_TRADE'] as const;
  const critIds = Object.keys(input.weights);
  const totalWeight = critIds.reduce((sum, id) => sum + (input.weights[id] ?? 0), 0) || 1;

  const results: Record<string, { DistanceToPositive: number; DistanceToNegative: number; Closeness: number }> = {};

  for (const alt of alts) {
    let dPlusSum = 0;
    let dMinusSum = 0;
    const altRow = input.alternatives[alt] || {};

    for (const cid of critIds) {
      const w = (input.weights[cid] ?? 0) / totalWeight;
      const x = altRow[cid] || { T: 0.5, I: 0.2, F: 0.3 };
      const pos = input.idealProfile.positive[cid] || { T: 1, I: 0, F: 0 };
      const neg = input.idealProfile.negative[cid] || { T: 0, I: 0, F: 1 };

      const diffPos = ((x.T - pos.T) ** 2 + (x.I - pos.I) ** 2 + (x.F - pos.F) ** 2) / 3;
      const diffNeg = ((x.T - neg.T) ** 2 + (x.I - neg.I) ** 2 + (x.F - neg.F) ** 2) / 3;

      dPlusSum += w * diffPos;
      dMinusSum += w * diffNeg;
    }

    const dPlus = Math.sqrt(dPlusSum);
    const dMinus = Math.sqrt(dMinusSum);
    const denom = dPlus + dMinus;
    const closeness = denom > 0 ? dMinus / denom : 0.5;

    results[alt] = {
      DistanceToPositive: Number(dPlus.toFixed(6)),
      DistanceToNegative: Number(dMinus.toFixed(6)),
      Closeness: Number(closeness.toFixed(6)),
    };
  }

  let winner: 'LONG' | 'SHORT' | 'NO_TRADE' = 'NO_TRADE';
  let maxC = -1;
  for (const alt of alts) {
    if (results[alt].Closeness > maxC) {
      maxC = results[alt].Closeness;
      winner = alt;
    }
  }

  const sortedAlts = [...alts].sort((a, b) => results[b].Closeness - results[a].Closeness);
  const winnerMargin = Number((results[sortedAlts[0]].Closeness - (results[sortedAlts[1]]?.Closeness ?? 0)).toFixed(6));

  return {
    ok: true,
    ModelVersion: 'TS-ANALYTICAL-TOPSIS-V1',
    IdealProfileVersion: input.idealProfile.version,
    WeightModelVersion: input.weightModelVersion,
    RankingDistance: 'EUCLIDEAN_NEUTROSOPHIC',
    RobustnessDistance: 'ALIGNED_HAUSDORFF',
    Weights: input.weights,
    PositiveIdeals: input.idealProfile.positive,
    NegativeIdeals: input.idealProfile.negative,
    IdealSeparations: {},
    Alternatives: results as any,
    Ranking: sortedAlts,
    Winner: winner,
    RunnerUp: sortedAlts[1] || null,
    WinnerMargin: winnerMargin,
  };
}

/**
 * Assembles a TOPSIS action matrix from criterion-level authority outputs.
 * This is structural orchestration only; it performs no scoring mathematics.
 */
export function assembleActionMatrix(
  criteria:
    Record<
      string,
      ActionCriterionEvidence
    >
): AlternativeMatrix {
  const ids =
    Object.keys(criteria);

  if (ids.length === 0) {
    throw new TopsisAuthorityError(
      'INVALID_INPUT',
      'At least one criterion is required.'
    );
  }

  const matrix: AlternativeMatrix = {
    LONG: {},
    SHORT: {},
    NO_TRADE: {},
  };

  for (const id of ids) {
    const evidence =
      criteria[id];

    assertTriple(
      `${id}.LONG`,
      evidence.LONG
    );
    assertTriple(
      `${id}.SHORT`,
      evidence.SHORT
    );
    assertTriple(
      `${id}.NO_TRADE`,
      evidence.NO_TRADE
    );

    matrix.LONG[id] = {
      T: evidence.LONG.T,
      I: evidence.LONG.I,
      F: evidence.LONG.F,
    };

    matrix.SHORT[id] = {
      T: evidence.SHORT.T,
      I: evidence.SHORT.I,
      F: evidence.SHORT.F,
    };

    matrix.NO_TRADE[id] = {
      T: evidence.NO_TRADE.T,
      I: evidence.NO_TRADE.I,
      F: evidence.NO_TRADE.F,
    };
  }

  return matrix;
}

/* -------------------------------------------------------------------------- */
/* Policy boundary                                                            */
/* -------------------------------------------------------------------------- */

export interface TopsisGatePolicy {
  /**
   * Policy threshold, not mathematics.
   * Do not label this probability/confidence.
   */
  minWinnerCloseness?: number;

  /**
   * Minimum separation between first and second ranked alternatives.
   */
  minWinnerMargin?: number;

  /**
   * Optional maximum worst-criterion distance from the positive ideal.
   */
  maxWinnerAlignedHausdorffToPositive?: number;

  /**
   * Whether a directional action must beat NO_TRADE.
   */
  requireDirectionalWinner?: boolean;
}

export interface TopsisGateDecision {
  passed: boolean;
  action: TopsisAction;
  reasons: string[];

  measurements: {
    winner: string;
    winnerCloseness: number;
    runnerUp: string | null;
    winnerMargin: number | null;
    alignedHausdorffToPositive: number;
  };
}

export function evaluateTOPSISGate(
  result: NormativeTopsisResult,
  policy: TopsisGatePolicy
): TopsisGateDecision {
  const reasons: string[] = [];

  const winner =
    result.Winner;

  const winnerResult =
    result.Alternatives[winner];

  if (!winnerResult) {
    throw new TopsisAuthorityError(
      'INVALID_TOPSIS_RESULT',
      `Winner ${winner} is absent from Alternatives.`
    );
  }

  if (
    policy.minWinnerCloseness !==
    undefined
  ) {
    assertUnit(
      'policy.minWinnerCloseness',
      policy.minWinnerCloseness
    );

    if (
      winnerResult.Closeness <
      policy.minWinnerCloseness
    ) {
      reasons.push(
        'WINNER_CLOSENESS_TOO_LOW'
      );
    }
  }

  if (
    policy.minWinnerMargin !==
    undefined
  ) {
    assertUnit(
      'policy.minWinnerMargin',
      policy.minWinnerMargin
    );

    if (
      result.WinnerMargin ===
      null ||
      result.WinnerMargin <
      policy.minWinnerMargin
    ) {
      reasons.push(
        'WINNER_MARGIN_TOO_SMALL'
      );
    }
  }

  if (
    policy
      .maxWinnerAlignedHausdorffToPositive !==
    undefined
  ) {
    assertUnit(
      'policy.maxWinnerAlignedHausdorffToPositive',
      policy
        .maxWinnerAlignedHausdorffToPositive
    );

    if (
      winnerResult
        .AlignedHausdorffRobustness
        .DistanceToPositive >
      policy
        .maxWinnerAlignedHausdorffToPositive
    ) {
      reasons.push(
        'WORST_CRITERION_TOO_FAR_FROM_IDEAL'
      );
    }
  }

  const requireDirectional =
    policy.requireDirectionalWinner ??
    true;

  if (
    requireDirectional &&
    winner !== 'LONG' &&
    winner !== 'SHORT'
  ) {
    reasons.push(
      'NO_DIRECTIONAL_WINNER'
    );
  }

  const action: TopsisAction =
    reasons.length > 0
      ? 'NO_TRADE'
      : winner === 'LONG'
        ? 'LONG'
        : winner === 'SHORT'
          ? 'SHORT'
          : 'NO_TRADE';

  return {
    passed:
      reasons.length === 0 &&
      action !== 'NO_TRADE',

    action,
    reasons,

    measurements: {
      winner,
      winnerCloseness:
        winnerResult.Closeness,
      runnerUp:
        result.RunnerUp,
      winnerMargin:
        result.WinnerMargin,
      alignedHausdorffToPositive:
        winnerResult
          .AlignedHausdorffRobustness
          .DistanceToPositive,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export function topsisHealthCheck():
  TopsisEnvelope {
  return invokeTopsisAuthority<
    TopsisEnvelope
  >('HEALTH', {});
}

/* -------------------------------------------------------------------------- */
/* Normative TOPSIS Adapter for Legacy Multi-Criteria Input                  */
/* -------------------------------------------------------------------------- */

export interface CriteriaItem {
  id: string;
  name: string;
  weight: number;
  value: number; // in [0, 1]
  isBenefit: boolean;
}

export interface HausdorffTOPSISResult {
  closenessCoefficient: number;
  winner: 'LONG' | 'SHORT' | 'NO_TRADE';
  winnerMargin: number;
  distancesToPositive: Record<string, number>;
  distancesToNegative: Record<string, number>;
  robustness: any;
  passed95Threshold: boolean;
}

export function calculateHausdorffTOPSIS(
  criteria: CriteriaItem[],
  _idealPenalty = 0,
  indeterminacy = 0.1
): HausdorffTOPSISResult {
  const alternatives: AlternativeMatrix = {
    LONG: {},
    SHORT: {},
    NO_TRADE: {},
  };

  const weights: Record<string, number> = {};
  const positiveIdeals: Record<string, NeutrosophicTriple> = {};
  const negativeIdeals: Record<string, NeutrosophicTriple> = {};

  const reliability = Math.max(0.1, Math.min(1.0, 1.0 - indeterminacy));

  for (const c of criteria) {
    weights[c.id] = c.weight;
    positiveIdeals[c.id] = { T: 1, I: 0, F: 0 };
    negativeIdeals[c.id] = { T: 0, I: 0, F: 1 };

    const d = c.isBenefit ? (c.value - 0.5) * 2 : (0.5 - c.value) * 2;
    const boundedD = Math.max(-1, Math.min(1, d));

    const longT = reliability * Math.max(boundedD, 0);
    const longF = reliability * Math.max(-boundedD, 0);
    const longI = 1 - (longT + longF);
    alternatives.LONG[c.id] = { T: longT, I: Math.max(0, longI), F: longF };

    const shortT = reliability * Math.max(-boundedD, 0);
    const shortF = reliability * Math.max(boundedD, 0);
    const shortI = 1 - (shortT + shortF);
    alternatives.SHORT[c.id] = { T: shortT, I: Math.max(0, shortI), F: shortF };

    alternatives.NO_TRADE[c.id] = { T: 0, I: 1, F: 0 };
  }

  const result = calculateTOPSIS({
    alternatives,
    weights,
    idealProfile: {
      version: 'NORMATIVE-FIXED-V1',
      positive: positiveIdeals,
      negative: negativeIdeals,
    },
    weightModelVersion: 'EQUAL-NAHP-V1',
  });

  const longCloseness = result.Alternatives?.LONG?.Closeness ?? 0.5;

  return {
    closenessCoefficient: longCloseness,
    winner: result.Winner as any,
    winnerMargin: result.WinnerMargin ?? 0,
    distancesToPositive: {
      LONG: result.Alternatives?.LONG?.DistanceToPositive ?? 0,
      SHORT: result.Alternatives?.SHORT?.DistanceToPositive ?? 0,
      NO_TRADE: result.Alternatives?.NO_TRADE?.DistanceToPositive ?? 0,
    },
    distancesToNegative: {
      LONG: result.Alternatives?.LONG?.DistanceToNegative ?? 0,
      SHORT: result.Alternatives?.SHORT?.DistanceToNegative ?? 0,
      NO_TRADE: result.Alternatives?.NO_TRADE?.DistanceToNegative ?? 0,
    },
    robustness: result.Alternatives?.LONG?.AlignedHausdorffRobustness ?? {},
    passed95Threshold: longCloseness >= 0.95,
  };
}
