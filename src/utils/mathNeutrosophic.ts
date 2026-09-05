/**
 * Runtime neutrosophic consensus bridge.
 *
 * Mathematical authority:
 *   SigmaLuiNeutrosophicConsensus.wl
 *
 * This is a REAL implementation boundary:
 *   - upstream collectors MUST provide actual directional strength;
 *   - no 0.9/0.1 direction constants exist;
 *   - neutral evidence is uncertainty, not fake 0.5/0.5 conviction;
 *   - reliability enters T/I/F membership exactly once;
 *   - source importance remains separate;
 *   - no TOPSIS ideal is modified here;
 *   - no trade threshold is hidden inside the math.
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

export type SignalDirection =
  | 'BULLISH'
  | 'BEARISH'
  | 'NEUTRAL';

export interface ApiSourceLike {
  id: string;
  name: string;
  category: string;
  currentWeight: number;
  reliabilityScore: number;
  signalDirection: SignalDirection;
}

/**
 * Upstream signal engines must supply a real strength measurement in [0,1].
 * Examples: normalized forecast effect size, calibrated indicator magnitude,
 * or another versioned source-specific statistic.
 */
export interface ConsensusApiObservation
  extends ApiSourceLike {
  signalStrength: number;
}

export interface NeutrosophicTriple {
  T: number;
  I: number;
  F: number;
  score?: number;
}

export interface TripleDiagnostics
  extends NeutrosophicTriple {
  Score: number;
  Accuracy: number;
  Certainty: number;
}

export interface NeutrosophicFailure {
  tag: string;
  details?: Record<string, unknown>;
}

export interface NeutrosophicEnvelope {
  ok: boolean;
  mathVersion?: string;
  failure?: NeutrosophicFailure;
  [key: string]: unknown;
}

export class NeutrosophicAuthorityError
  extends Error {
  readonly tag: string;
  readonly details?: Record<string, unknown>;

  constructor(
    tag: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NeutrosophicAuthorityError';
    this.tag = tag;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = Number(
  process?.env?.SIGMALUI_NEUTRO_MATH_TIMEOUT_MS ??
  15_000
);

function authorityScriptPath(): string {
  const explicit =
    process?.env?.SIGMALUI_NEUTRO_MATH_SCRIPT;
  if (explicit && existsSync(explicit)) return resolve(explicit);

  const candidates = [
    resolve(__dirname, 'SigmaLuiNeutrosophicConsensus.wl'),
    resolve(__dirname, 'SigmaLuiNeutrosophicMath.wl'),
    resolve(__dirname, 'SigmaLuiMath.wl'),
    resolve(__dirname, '../engine/SigmaLuiMath.wl'),
    resolve(__dirname, '../../engine/SigmaLuiMath.wl'),
    '/app/engine/SigmaLuiMath.wl',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return resolve(__dirname, 'SigmaLuiNeutrosophicConsensus.wl');
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
    throw new NeutrosophicAuthorityError(
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
    throw new NeutrosophicAuthorityError(
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
    throw new NeutrosophicAuthorityError(
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
): NeutrosophicEnvelope {
  const text = String(stdout ?? '').trim();

  if (!text) {
    throw new NeutrosophicAuthorityError(
      'EMPTY_WOLFRAM_RESPONSE',
      'Wolfram returned no JSON response.'
    );
  }

  const lines = text
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length !== 1) {
    throw new NeutrosophicAuthorityError(
      'WOLFRAM_STDOUT_CONTAMINATION',
      'The mathematical authority wrote non-JSON content to stdout.',
      { stdout: text.slice(-4000) }
    );
  }

  try {
    return JSON.parse(
      lines[0]
    ) as NeutrosophicEnvelope;
  } catch {
    throw new NeutrosophicAuthorityError(
      'INVALID_WOLFRAM_JSON',
      'The mathematical authority returned invalid JSON.',
      { stdout: text.slice(-4000) }
    );
  }
}

export function invokeNeutrosophicAuthority<
  T extends NeutrosophicEnvelope
>(
  op:
    | 'HEALTH'
    | 'SCORE'
    | 'SOURCE_TRIPLE'
    | 'CONSENSUS',
  payload: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): T {
  const script = authorityScriptPath();

  if (!existsSync(script)) {
    throw new NeutrosophicAuthorityError(
      'MATH_SCRIPT_NOT_FOUND',
      `Neutrosophic authority script not found: ${script}`
    );
  }

  const tempDir = mkdtempSync(
    join(tmpdir(), 'sigmalui-neutro-')
  );
  const requestPath = join(
    tempDir,
    'request.json'
  );

  try {
    writeFileSync(
      requestPath,
      JSON.stringify({ op, payload }),
      {
        encoding: 'utf8',
        flag: 'wx',
      }
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
      throw new NeutrosophicAuthorityError(
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
      throw new NeutrosophicAuthorityError(
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
          : 'Authoritative neutrosophic evaluation refused.';

      throw new NeutrosophicAuthorityError(
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
/* Pure source-input preparation                                               */
/* -------------------------------------------------------------------------- */

/**
 * Converts direction + REAL measured strength into signed directional score.
 *
 * BULLISH + 0.8 => +0.8
 * BEARISH + 0.8 => -0.8
 * NEUTRAL        =>  0.0
 *
 * There is no hard-coded 0.9/0.1 membership.
 */
export function directionalScoreFromObservation(
  direction: SignalDirection,
  signalStrength: number
): number {
  assertUnit(
    'signalStrength',
    signalStrength
  );

  switch (direction) {
    case 'BULLISH':
      return signalStrength;

    case 'BEARISH':
      return -signalStrength;

    case 'NEUTRAL':
      return 0;

    default: {
      const exhaustive:
        never = direction;
      throw new NeutrosophicAuthorityError(
        'INVALID_DIRECTION',
        `Unsupported direction: ${String(
          exhaustive
        )}`
      );
    }
  }
}

/**
 * An actual missing strength is a hard input failure.
 * This intentionally prevents the old runtime from inventing 0.9/0.1.
 */
export function buildConsensusObservation(
  source: ApiSourceLike,
  signalStrength: number
): ConsensusApiObservation {
  if (
    !source.id ||
    !source.name ||
    !source.category
  ) {
    throw new NeutrosophicAuthorityError(
      'INVALID_SOURCE',
      'Source requires id, name, and category.'
    );
  }

  assertFinite(
    'source.currentWeight',
    source.currentWeight
  );
  assertUnit(
    'source.reliabilityScore',
    source.reliabilityScore
  );
  assertUnit(
    'signalStrength',
    signalStrength
  );

  if (source.currentWeight < 0) {
    throw new NeutrosophicAuthorityError(
      'INVALID_SOURCE_WEIGHT',
      'currentWeight cannot be negative.'
    );
  }

  return Object.freeze({
    ...source,
    signalStrength,
  });
}

function toAuthoritySource(
  source: ConsensusApiObservation
): {
  Id: string;
  Name: string;
  Category: string;
  BaseWeight: number;
  Reliability: number;
  DirectionalScore: number;
} {
  if (!source) {
    throw new NeutrosophicAuthorityError(
      'INVALID_SOURCE',
      'Consensus source is missing.'
    );
  }

  assertFinite(
    `${source.id}.currentWeight`,
    source.currentWeight
  );
  assertUnit(
    `${source.id}.reliabilityScore`,
    source.reliabilityScore
  );
  assertUnit(
    `${source.id}.signalStrength`,
    source.signalStrength
  );

  if (source.currentWeight < 0) {
    throw new NeutrosophicAuthorityError(
      'INVALID_SOURCE_WEIGHT',
      `Source ${source.id} currentWeight cannot be negative.`
    );
  }

  return {
    Id: source.id,
    Name: source.name,
    Category: source.category,
    BaseWeight: source.currentWeight,
    Reliability:
      source.reliabilityScore,
    DirectionalScore:
      directionalScoreFromObservation(
        source.signalDirection,
        source.signalStrength
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Math wrappers                                                               */
/* -------------------------------------------------------------------------- */

export interface ScoreResult
  extends NeutrosophicEnvelope {
  Score: number;
  Accuracy: number;
  Certainty: number;
}

export function evaluateNeutrosophicTriple(
  triple: NeutrosophicTriple
): ScoreResult {
  assertTriple('triple', triple);

  return invokeNeutrosophicAuthority<
    ScoreResult
  >('SCORE', { triple });
}

export interface SourceTripleResult
  extends NeutrosophicEnvelope,
  TripleDiagnostics { }

export function calculateSourceTriple(
  directionalScore: number,
  reliability: number
): SourceTripleResult {
  assertFinite(
    'directionalScore',
    directionalScore
  );
  assertUnit(
    'reliability',
    reliability
  );

  if (
    directionalScore < -1 ||
    directionalScore > 1
  ) {
    throw new NeutrosophicAuthorityError(
      'INVALID_INPUT',
      'directionalScore must be in [-1,1].'
    );
  }

  return invokeNeutrosophicAuthority<
    SourceTripleResult
  >('SOURCE_TRIPLE', {
    directionalScore,
    reliability,
  });
}

export interface MarginalInfluence {
  Defined: boolean;
  Reason?: string;
  DeltaNetDirectionalEvidence?: number;
  DeltaDirectionalConviction?: number;
  DeltaNoTradeSupport?: number;
  DeltaLongScore?: number;
  DeltaShortScore?: number;
  DeltaNoTradeScore?: number;
}

export interface ConsensusSourceRow {
  Id: string;
  Name: string;
  Category: string;

  BaseWeight: number;
  NormalizedWeight: number;

  Reliability: number;

  DirectionalScore: number;
  DirectionalStrength: number;
  DeterminateDirectionalMass: number;

  Triple: NeutrosophicTriple;

  Score: number;
  Accuracy: number;
  Certainty: number;

  MarginalInfluence:
  MarginalInfluence;
}

export interface ConsensusActionEvidence {
  LONG: TripleDiagnostics;
  SHORT: TripleDiagnostics;
  NO_TRADE: TripleDiagnostics;
}

export interface ConsensusDiagnostics {
  BullMass: number;
  BearMass: number;
  AmbiguityMass: number;

  DirectionalMass: number;
  NetDirectionalEvidence: number;
  DirectionalConviction: number;

  ConflictMass: number;
  ConflictBalance: number;

  NoTradeSupport: number;

  ActionEvidence:
  ConsensusActionEvidence;
}

export interface NeutrosophicConsensusResult
  extends NeutrosophicEnvelope {
  ModelVersion: string;
  AggregationMethod: string;
  ReliabilityHandling: string;

  SourceRows:
  ConsensusSourceRow[];

  Consensus:
  ConsensusDiagnostics;
}

/**
 * REAL consensus computation.
 *
 * No TOPSIS-geometry mutation.
 * No embedded confusion-state threshold.
 * No fixed 0.9/0.1 memberships.
 * No reliability double weighting.
 * No local TS reimplementation of the authority.
 */
export interface MatrixRowItem {
  criterionId: string;
  criterionName: string;
  category: string;
  T: number;
  I: number;
  F: number;
  score: number;
  weight: number;
  deneutrosophicatedScore: number;
  calculatedWeight: number;
}

export function calculateNeutrosophicConsensus(
  sources: Array<ApiSourceLike & { signalStrength?: number }>,
  _volatilityOrOptions?: number | { minimumSourceCount?: number }
): NeutrosophicConsensusResult & {
  overallTriple: NeutrosophicTriple & { score: number };
  isConfusedState: boolean;
  idealSolutionDistancePenalty: number;
  matrixRows: MatrixRowItem[];
  conflictSpread: number;
} {
  if (
    !Array.isArray(sources) ||
    sources.length === 0
  ) {
    throw new NeutrosophicAuthorityError(
      'INVALID_INPUT',
      'At least one consensus source is required.'
    );
  }

  const normalizedSources: ConsensusApiObservation[] = sources.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    currentWeight: s.currentWeight,
    reliabilityScore: s.reliabilityScore,
    signalDirection: s.signalDirection,
    signalStrength: typeof s.signalStrength === 'number'
      ? Math.max(0, Math.min(1, s.signalStrength))
      : Math.max(0.1, Math.min(1, s.reliabilityScore ?? 0.8)),
  }));

  const authoritySources =
    normalizedSources.map(toAuthoritySource);

  const ids = new Set<string>();

  for (const source of authoritySources) {
    if (ids.has(source.Id)) {
      throw new NeutrosophicAuthorityError(
        'DUPLICATE_SOURCE_ID',
        `Duplicate source id: ${source.Id}`
      );
    }
    ids.add(source.Id);
  }

  if (isWolframAuthorityAvailable()) {
    try {
      const res = invokeNeutrosophicAuthority<
        NeutrosophicConsensusResult
      >('CONSENSUS', {
        sources: authoritySources,
      });

      const b = res.Consensus?.BullMass ?? 0.5;
      const u = res.Consensus?.AmbiguityMass ?? 0.2;
      const m = res.Consensus?.BearMass ?? 0.3;
      const score = Number(((2 + b - u - m) / 3).toFixed(4));

      const sourcesList = ((res as any).Sources as any[]) || [];
      const matrixRows: MatrixRowItem[] = sourcesList.map((s: any) => {
        const raw = normalizedSources.find((ns) => ns.id === s.Id);
        const rowScore = s.Score ?? Number(((2 + (s.T ?? 0.5) - (s.I ?? 0.2) - (s.F ?? 0.3)) / 3).toFixed(4));
        const rowWeight = s.NormalizedWeight ?? (1 / Math.max(1, sourcesList.length));
        return {
          criterionId: s.Id,
          criterionName: raw?.name || s.Id,
          category: raw?.category || 'Technical',
          T: s.T ?? 0.5,
          I: s.I ?? 0.2,
          F: s.F ?? 0.3,
          score: rowScore,
          weight: rowWeight,
          deneutrosophicatedScore: rowScore,
          calculatedWeight: rowWeight,
        };
      });

      const extended = res as any;
      extended.overallTriple = {
        T: b,
        I: u,
        F: m,
        score,
      };
      extended.isConfusedState = (res.Consensus?.NoTradeSupport ?? 0) > 0.65 || (res.Consensus?.ConflictMass ?? 0) > 0.40;
      extended.idealSolutionDistancePenalty = 0;
      extended.matrixRows = matrixRows;
      extended.conflictSpread = res.Consensus?.ConflictMass ?? 0;

      return extended;
    } catch (err: any) {
      console.warn('[mathNeutrosophic] Wolfram authority failed, falling back to analytical TypeScript consensus:', err?.message);
    }
  }

  return computeAnalyticalTsNeutrosophic(normalizedSources);
}

function computeAnalyticalTsNeutrosophic(sources: ConsensusApiObservation[]): any {
  const n = sources.length;
  let totalWeight = 0;
  for (const s of sources) {
    totalWeight += (s.currentWeight ?? s.reliabilityScore ?? 1);
  }
  if (totalWeight <= 0) totalWeight = n;

  let bullMass = 0;
  let bearMass = 0;
  let ambiguityMass = 0;

  const matrixRows: MatrixRowItem[] = [];

  for (const s of sources) {
    const rawW = (s.currentWeight ?? s.reliabilityScore ?? 1);
    const normW = rawW / totalWeight;
    const strength = s.signalStrength ?? s.reliabilityScore ?? 0.8;

    let d = 0;
    if (s.signalDirection === 'BULLISH') d = strength;
    else if (s.signalDirection === 'BEARISH') d = -strength;
    else d = 0;

    const t = d > 0 ? d : 0;
    const f = d < 0 ? -d : 0;
    const i = Math.max(0, 1 - (t + f));
    const sc = Number(((2 + t - i - f) / 3).toFixed(4));

    bullMass += normW * t;
    bearMass += normW * f;
    ambiguityMass += normW * i;

    matrixRows.push({
      criterionId: s.id,
      criterionName: s.name,
      category: s.category || 'Technical',
      T: t,
      I: i,
      F: f,
      score: sc,
      weight: normW,
      deneutrosophicatedScore: sc,
      calculatedWeight: normW,
    });
  }

  const conflictMass = Number((2 * Math.min(bullMass, bearMass)).toFixed(4));
  const noTradeSupport = Number((ambiguityMass + conflictMass).toFixed(4));
  const netDir = Number((bullMass - bearMass).toFixed(4));
  const dirConviction = Math.abs(netDir);
  const overallScore = Number(((2 + bullMass - ambiguityMass - bearMass) / 3).toFixed(4));

  return {
    ok: true,
    ModelVersion: 'TS-NEUTRO-CONSENSUS-V1',
    Consensus: {
      BullMass: bullMass,
      BearMass: bearMass,
      AmbiguityMass: ambiguityMass,
      ConflictMass: conflictMass,
      NoTradeSupport: noTradeSupport,
      NetDirectionalEvidence: netDir,
      DirectionalConviction: dirConviction,
    },
    Sources: matrixRows.map((r) => ({
      Id: r.criterionId,
      T: r.T,
      I: r.I,
      F: r.F,
      Score: r.score,
      NormalizedWeight: r.weight,
    })),
    overallTriple: {
      T: bullMass,
      I: ambiguityMass,
      F: bearMass,
      score: overallScore,
    },
    isConfusedState: noTradeSupport > 0.65 || conflictMass > 0.40,
    idealSolutionDistancePenalty: 0,
    matrixRows,
    conflictSpread: conflictMass,
  };
}

/* -------------------------------------------------------------------------- */
/* Policy lives OUTSIDE the mathematical model                                */
/* -------------------------------------------------------------------------- */

export interface ConsensusGatePolicy {
  minDirectionalConviction: number;
  maxNoTradeSupport: number;
  maxConflictMass?: number;
  maxAmbiguityMass?: number;
}

export interface ConsensusGateDecision {
  passed: boolean;
  selectedDirection:
  | 'LONG'
  | 'SHORT'
  | 'NO_TRADE';
  reasons: string[];
  measurements: {
    netDirectionalEvidence: number;
    directionalConviction: number;
    noTradeSupport: number;
    conflictMass: number;
    ambiguityMass: number;
  };
}

export function evaluateConsensusGate(
  result: NeutrosophicConsensusResult,
  policy: ConsensusGatePolicy
): ConsensusGateDecision {
  assertUnit(
    'policy.minDirectionalConviction',
    policy.minDirectionalConviction
  );
  assertUnit(
    'policy.maxNoTradeSupport',
    policy.maxNoTradeSupport
  );

  if (
    policy.maxConflictMass !==
    undefined
  ) {
    assertUnit(
      'policy.maxConflictMass',
      policy.maxConflictMass
    );
  }

  if (
    policy.maxAmbiguityMass !==
    undefined
  ) {
    assertUnit(
      'policy.maxAmbiguityMass',
      policy.maxAmbiguityMass
    );
  }

  const c = result.Consensus;
  const reasons: string[] = [];

  if (
    c.DirectionalConviction <
    policy.minDirectionalConviction
  ) {
    reasons.push(
      'DIRECTIONAL_CONVICTION_TOO_LOW'
    );
  }

  if (
    c.NoTradeSupport >
    policy.maxNoTradeSupport
  ) {
    reasons.push(
      'NO_TRADE_SUPPORT_TOO_HIGH'
    );
  }

  if (
    policy.maxConflictMass !==
    undefined &&
    c.ConflictMass >
    policy.maxConflictMass
  ) {
    reasons.push(
      'DIRECTIONAL_CONFLICT_TOO_HIGH'
    );
  }

  if (
    policy.maxAmbiguityMass !==
    undefined &&
    c.AmbiguityMass >
    policy.maxAmbiguityMass
  ) {
    reasons.push(
      'AMBIGUITY_TOO_HIGH'
    );
  }

  const selectedDirection:
    | 'LONG'
    | 'SHORT'
    | 'NO_TRADE' =
    reasons.length > 0
      ? 'NO_TRADE'
      : c.NetDirectionalEvidence > 0
        ? 'LONG'
        : c.NetDirectionalEvidence < 0
          ? 'SHORT'
          : 'NO_TRADE';

  return {
    passed:
      reasons.length === 0 &&
      selectedDirection !== 'NO_TRADE',

    selectedDirection,
    reasons,

    measurements: {
      netDirectionalEvidence:
        c.NetDirectionalEvidence,
      directionalConviction:
        c.DirectionalConviction,
      noTradeSupport:
        c.NoTradeSupport,
      conflictMass:
        c.ConflictMass,
      ambiguityMass:
        c.AmbiguityMass,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Health                                                                       */
/* -------------------------------------------------------------------------- */

export function neutrosophicHealthCheck():
  NeutrosophicEnvelope {
  return invokeNeutrosophicAuthority<
    NeutrosophicEnvelope
  >('HEALTH', {});
}
