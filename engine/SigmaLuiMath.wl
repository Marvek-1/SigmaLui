(* ::Package:: *)

BeginPackage["SigmaLuiMath`"];

$SigmaLuiMathVersion::usage =
  "$SigmaLuiMathVersion is the version of the authoritative SigmaLui mathematical layer.";

DeneutrosophicateSVNN::usage =
  "DeneutrosophicateSVNN[<|\"T\"->t,\"I\"->i,\"F\"->f|>] returns the published SVNN score (3+T-2 I-F)/4.";

CalculateSTSVNWA::usage =
  "CalculateSTSVNWA[triples] evaluates the sine-trigonometric SVN weighted aggregation operator and diagnostics.";

CalculateTCNS::usage =
  "CalculateTCNS[triple, ageSeconds, halfLifeSeconds] applies symmetric evidence decay to T and F and transfers age into indeterminacy.";

CalculateNAHP::usage =
  "CalculateNAHP[pairwiseMatrix] deneutrosophicates SVTNN entries when present, validates reciprocity, and returns principal-eigenvector AHP weights and consistency diagnostics.";

CalculateNormativeTOPSIS::usage =
  "CalculateNormativeTOPSIS[alternatives, weights, positiveIdeals, negativeIdeals] evaluates fixed-ideal neutrosophic TOPSIS and Hausdorff robustness diagnostics.";

CalculateGM11::usage =
  "CalculateGM11[sequence, horizon] fits a fail-closed GM(1,1) with level-ratio, rank, condition, residual, posterior-error, and rolling one-step diagnostics.";

CalculateGRA::usage =
  "CalculateGRA[reference, candidates, rho, normalization, deltaBounds] performs aligned Grey Relational Analysis without silent imputation.";

Wasserstein1D::usage =
  "Wasserstein1D[a,b] returns the empirical one-dimensional Wasserstein-1 distance via quantile coupling.";

FitGaussianHMMRegime::usage =
  "FitGaussianHMMRegime[returns] fits a genuine univariate Gaussian HMM by scaled Baum-Welch and returns posterior regime probabilities and Wasserstein distances.";

HistoricalExpectedShortfall::usage =
  "HistoricalExpectedShortfall[losses, alpha] computes historical VaR and Expected Shortfall from an observed loss distribution.";

SigmaLuiMathRequest::usage =
  "SigmaLuiMathRequest[assoc] dispatches a deterministic JSON-style request to the mathematical authority.";

SigmaLuiMathSelfTest::usage =
  "SigmaLuiMathSelfTest[] runs deterministic mathematical invariant/known-answer checks.";

VerifyDecisionTrace::usage =
  "VerifyDecisionTrace[trace] independently verifies a DecisionTrace payload, validating (T,I,F) score, Hausdorff TOPSIS closeness, and conjunctive tier invariants.";

Begin["`Private`"];

$SigmaLuiMathVersion = "SIGMALUI-MATH-2.0.0";

ClearAll[fail];
fail[tag_String, message_String, data_: <||>] :=
  Failure[tag, Join[<|"Message" -> message, "MathVersion" -> $SigmaLuiMathVersion|>, data]];

ClearAll[finiteRealQ];
finiteRealQ[x_] := Quiet@Check[
   NumericQ[x] && Im[N[x]] == 0 &&
    FreeQ[N[x], Indeterminate | ComplexInfinity | DirectedInfinity],
   False
];

ClearAll[validUnitTripleQ];
validUnitTripleQ[a_Association] := Module[{v},
  If[!And @@ (KeyExistsQ[a, #] & /@ {"T", "I", "F"}), Return[False]];
  v = N@Lookup[a, {"T", "I", "F"}];
  VectorQ[v, finiteRealQ] && And @@ (0 <= # <= 1 & /@ v)
];
validUnitTripleQ[_] := False;

ClearAll[tripleVector];
tripleVector[a_Association] := N@Lookup[a, {"T", "I", "F"}];

ClearAll[DeneutrosophicateSVNN];
DeneutrosophicateSVNN[a_Association] := Module[{t, i, f},
  If[!validUnitTripleQ[a],
    Return[fail["InvalidNeutrosophicTriple", "T, I and F must be finite values in [0,1]."]]
  ];
  {t, i, f} = tripleVector[a];
  N[(3 + t - 2 i - f)/4]
];

(* Published-style score for a single-valued triangular neutrosophic number:
   S1(A~) = (lower + modal + upper)/8 * (2 + T - I - F).
   The model contract must version this mapping; it is not interchangeable
   with other published deneutrosophication score functions. *)
ClearAll[deneutrosophicateSVTNN];
deneutrosophicateSVTNN[a_Association] := Module[{l, m, u, t, i, f, s},
  If[!And @@ (KeyExistsQ[a, #] & /@ {"Lower", "Modal", "Upper", "T", "I", "F"}),
    Return[fail["InvalidSVTNN", "SVTNN requires Lower, Modal, Upper, T, I and F."]]
  ];
  {l, m, u, t, i, f} = N@Lookup[a, {"Lower", "Modal", "Upper", "T", "I", "F"}];
  If[!VectorQ[{l, m, u, t, i, f}, finiteRealQ] || !(0 < l <= m <= u) ||
     !And @@ (0 <= # <= 1 & /@ {t, i, f}),
    Return[fail["InvalidSVTNN", "SVTNN bounds or memberships are invalid.", <|"Entry" -> a|>]]
  ];
  s = ((l + m + u)/8) (2 + t - i - f);
  If[!finiteRealQ[s] || s <= 0,
    Return[fail["InvalidSVTNNScore", "Deneutrosophicated pairwise intensity must be strictly positive.", <|"Score" -> s|>]]
  ];
  N[s]
];

ClearAll[CalculateSTSVNWA];
CalculateSTSVNWA[triples_List] := Module[
  {weights, totalWeight, normWeights, transformed, aggT, aggI, aggF, score, zeros},
  If[Length[triples] == 0,
    Return[fail["InsufficientData", "ST-SVNWA requires at least one triple."]]
  ];
  If[!And @@ (AssociationQ /@ triples) ||
     !And @@ (validUnitTripleQ /@ triples) ||
     !And @@ (KeyExistsQ[#, "Weight"] & /@ triples),
    Return[fail["InvalidInput", "Every ST-SVNWA item must contain valid T/I/F memberships and Weight."]]
  ];
  weights = N@Lookup[triples, "Weight"];
  If[!VectorQ[weights, finiteRealQ] || AnyTrue[weights, # < 0 &],
    Return[fail["InvalidWeights", "Weights must be finite and non-negative."]]
  ];
  totalWeight = Total[weights];
  If[!(totalWeight > 0),
    Return[fail["InvalidWeights", "At least one ST-SVNWA weight must be positive."]]
  ];
  normWeights = weights/totalWeight;

  transformed = Map[
    Function[item,
      With[{t = N[item["T"]], i = N[item["I"]], f = N[item["F"]]},
        <|
          "T" -> Sin[(Pi/2) t],
          "I" -> 1 - Sin[(Pi/2) (1 - i)],
          "F" -> 1 - Sin[(Pi/2) (1 - f)]
        |>
      ]
    ],
    triples
  ];

  aggT = 1 - Product[(1 - transformed[[k, "T"]])^normWeights[[k]], {k, Length[triples]}];
  aggI = Product[transformed[[k, "I"]]^normWeights[[k]], {k, Length[triples]}];
  aggF = Product[transformed[[k, "F"]]^normWeights[[k]], {k, Length[triples]}];

  score = DeneutrosophicateSVNN[<|"T" -> aggT, "I" -> aggI, "F" -> aggF|>];
  If[FailureQ[score], Return[score]];

  zeros = <|
    "IndeterminacyZeroAnnihilation" -> AnyTrue[MapThread[#1["I"] == 0. && #2 > 0 &, {transformed, normWeights}], TrueQ],
    "FalsityZeroAnnihilation" -> AnyTrue[MapThread[#1["F"] == 0. && #2 > 0 &, {transformed, normWeights}], TrueQ]
  |>;

  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "OperatorVersion" -> "ST-SVNWA-V1",
    "T" -> N[aggT], "I" -> N[aggI], "F" -> N[aggF],
    "Score" -> N[score],
    "NormalizedWeights" -> normWeights,
    "Diagnostics" -> zeros
  |>
];

ClearAll[CalculateTCNS];
CalculateTCNS[base_Association, dataAgeSeconds_?NumericQ, halfLifeSeconds_?NumericQ : 180.] := Module[
  {age = N[dataAgeSeconds], halfLife = N[halfLifeSeconds], d, t, i, f, out, score},
  If[!validUnitTripleQ[base],
    Return[fail["InvalidNeutrosophicTriple", "TCNS requires valid T/I/F memberships."]]
  ];
  If[!finiteRealQ[age] || age < 0,
    Return[fail["InvalidAge", "Data age must be a finite non-negative number of seconds."]]
  ];
  If[!finiteRealQ[halfLife] || halfLife <= 0,
    Return[fail["InvalidHalfLife", "Half-life must be finite and strictly positive."]]
  ];
  d = Exp[-Log[2] age/halfLife];
  {t, i, f} = tripleVector[base];

  (* Symmetric evidence decay: both asserted truth and falsity lose evidential
     force with age; indeterminacy rises. Staleness policy is intentionally
     NOT part of this mathematical function. *)
  out = <|
    "T" -> N[t d],
    "I" -> N[1 - (1 - i) d],
    "F" -> N[f d]
  |>;
  score = DeneutrosophicateSVNN[out];
  If[FailureQ[score], Return[score]];

  Join[
    <|
      "MathVersion" -> $SigmaLuiMathVersion,
      "ModelVersion" -> "TCNS-SYMMETRIC-EVIDENCE-DECAY-V1"
    |>,
    out,
    <|
      "Score" -> N[score],
      "DecayFactor" -> N[d],
      "DecayPenalty" -> N[1 - d],
      "DataAgeSeconds" -> age,
      "HalfLifeSeconds" -> halfLife
    |>
  ]
];

ClearAll[randomIndex];
randomIndex[n_Integer] := Lookup[
  <|1 -> 0., 2 -> 0., 3 -> 0.58, 4 -> 0.90, 5 -> 1.12, 6 -> 1.24,
    7 -> 1.32, 8 -> 1.41, 9 -> 1.45, 10 -> 1.49, 11 -> 1.51,
    12 -> 1.48, 13 -> 1.56, 14 -> 1.57, 15 -> 1.59|>,
  n,
  Null
];

ClearAll[crispPairwiseEntry];
crispPairwiseEntry[x_?NumericQ] := N[x];
crispPairwiseEntry[x_Association] := deneutrosophicateSVTNN[x];
crispPairwiseEntry[x_] := fail["InvalidPairwiseEntry", "Pairwise entries must be positive numbers or SVTNN associations.", <|"Entry" -> x|>];

Options[CalculateNAHP] = {
  "ReciprocityTolerance" -> 10^-6
};

ClearAll[CalculateNAHP];
CalculateNAHP[pairwise_List, OptionsPattern[]] := Module[
  {n, crisp, bad, tol, reciprocalError, vals, vecs, idx, lambdaMax, w, ci, ri, cr},
  n = Length[pairwise];
  If[n == 0 || !And @@ (ListQ /@ pairwise) || !SameQ @@ (Length /@ pairwise) || Length[First[pairwise]] != n,
    Return[fail["InvalidPairwiseMatrix", "AHP pairwise matrix must be non-empty and square."]]
  ];

  crisp = Map[crispPairwiseEntry, pairwise, {2}];
  bad = Cases[crisp, _Failure, Infinity];
  If[Length[bad] > 0, Return[First[bad]]];

  If[!MatrixQ[crisp, finiteRealQ] || AnyTrue[Flatten[crisp], # <= 0 &],
    Return[fail["InvalidPairwiseMatrix", "Deneutrosophicated AHP matrix must be finite and strictly positive."]]
  ];

  tol = N@OptionValue["ReciprocityTolerance"];
  If[Max[Abs[Diagonal[crisp] - 1.]] > tol,
    Return[fail["InvalidPairwiseDiagonal", "AHP diagonal entries must equal 1 within tolerance."]]
  ];

  reciprocalError = Max@Flatten@Table[Abs[crisp[[i, j]] crisp[[j, i]] - 1.], {i, n}, {j, n}];
  If[reciprocalError > tol,
    Return[fail["NonReciprocalPairwiseMatrix", "AHP pairwise matrix violates reciprocity.", <|"MaxReciprocityError" -> reciprocalError|>]]
  ];

  If[n == 1,
    Return[<|
      "MathVersion" -> $SigmaLuiMathVersion,
      "MethodVersion" -> "SVTNN-S1-CRISP-THEN-SAATY-EIGENVECTOR-V1",
      "CrispMatrix" -> crisp,
      "Weights" -> {1.},
      "LambdaMax" -> 1.,
      "CI" -> 0.,
      "RI" -> 0.,
      "CR" -> 0.,
      "MaxReciprocityError" -> reciprocalError
    |>]
  ];

  {vals, vecs} = Eigensystem[N[crisp]];
  idx = First@Ordering[Re[vals], -1];
  lambdaMax = Re[vals[[idx]]];
  w = Abs[Re[vecs[[idx]]]];
  If[Total[w] <= 0 || !VectorQ[w, finiteRealQ],
    Return[fail["InvalidEigenvector", "Principal AHP eigenvector is not numerically usable."]]
  ];
  w = N[w/Total[w]];
  ci = N[(lambdaMax - n)/(n - 1)];
  ri = randomIndex[n];
  cr = If[ri === Null, Null, If[ri == 0, 0., N[ci/ri]]];

  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "MethodVersion" -> "SVTNN-S1-CRISP-THEN-SAATY-EIGENVECTOR-V1",
    "CrispMatrix" -> crisp,
    "Weights" -> w,
    "LambdaMax" -> N[lambdaMax],
    "CI" -> ci,
    "RI" -> ri,
    "CR" -> cr,
    "MaxReciprocityError" -> N[reciprocalError]
  |>
];

ClearAll[weightedSVNNDistance];
weightedSVNNDistance[a_Association, b_Association, criteria_List, weights_Association] := Module[{terms},
  terms = Table[
    weights[c] Total[(tripleVector[a[c]] - tripleVector[b[c]])^2],
    {c, criteria}
  ];
  Sqrt[Total[terms]/3.]
];

ClearAll[alignedSupremumDistance];
alignedSupremumDistance[a_Association, b_Association, criteria_List, weights_Association] :=
  Max@Table[
    weights[c] Mean[Abs[tripleVector[a[c]] - tripleVector[b[c]]]],
    {c, criteria}
  ];

ClearAll[hausdorffSetDistance];
hausdorffSetDistance[a_Association, b_Association, criteria_List, weights_Association] := Module[
  {pa, pb, dist, hf, hb},
  pa = Table[weights[c] tripleVector[a[c]], {c, criteria}];
  pb = Table[weights[c] tripleVector[b[c]], {c, criteria}];
  dist[x_, y_] := Mean[Abs[x - y]];
  hf = Max@Table[Min[dist[pa[[i]], pb[[j]]], {j, Length[pb]}], {i, Length[pa]}];
  hb = Max@Table[Min[dist[pb[[j]], pa[[i]]], {i, Length[pa]}], {j, Length[pb]}];
  N[Max[hf, hb]]
];

ClearAll[validateCriterionTripleMap];
validateCriterionTripleMap[m_Association, criteria_List] :=
  Sort[Keys[m]] === Sort[criteria] && And @@ (validUnitTripleQ[m[#]] & /@ criteria);

ClearAll[CalculateNormativeTOPSIS];
CalculateNormativeTOPSIS[
  alternatives_Association,
  weights_Association,
  positiveIdeals_Association,
  negativeIdeals_Association
] := Module[
  {names, criteria, w, sumW, plus, minus, contribution, result},
  names = Keys[alternatives];
  If[Length[names] < 2,
    Return[fail["InsufficientAlternatives", "Normative TOPSIS requires at least two explicit action alternatives."]]
  ];
  criteria = Keys[weights];
  If[Length[criteria] == 0 ||
     !And @@ (finiteRealQ /@ Values[weights]) ||
     AnyTrue[Values[weights], # < 0 &],
    Return[fail["InvalidWeights", "TOPSIS weights must be finite, non-negative, and non-empty."]]
  ];
  sumW = Total[N@Values[weights]];
  If[!(sumW > 0), Return[fail["InvalidWeights", "At least one TOPSIS weight must be positive."]]];
  w = AssociationThread[criteria, N[Values[weights]/sumW]];

  If[!validateCriterionTripleMap[positiveIdeals, criteria] ||
     !validateCriterionTripleMap[negativeIdeals, criteria],
    Return[fail["InvalidNormativeIdeals", "Positive and negative ideals must be explicit valid T/I/F maps for every criterion."]]
  ];
  If[!And @@ (validateCriterionTripleMap[alternatives[#], criteria] & /@ names),
    Return[fail["InvalidAlternativeMatrix", "Every action alternative must provide a valid T/I/F triple for every criterion."]]
  ];

  result = Association@Table[
    With[
      {a = alternatives[name],
       dp = weightedSVNNDistance[alternatives[name], positiveIdeals, criteria, w],
       dm = weightedSVNNDistance[alternatives[name], negativeIdeals, criteria, w],
       hp = hausdorffSetDistance[alternatives[name], positiveIdeals, criteria, w],
       hm = hausdorffSetDistance[alternatives[name], negativeIdeals, criteria, w],
       sp = alignedSupremumDistance[alternatives[name], positiveIdeals, criteria, w],
       sm = alignedSupremumDistance[alternatives[name], negativeIdeals, criteria, w]},
      name -> <|
        "DistanceToPositive" -> N[dp],
        "DistanceToNegative" -> N[dm],
        "Closeness" -> N[If[dp + dm > 0, dm/(dp + dm), 0.]],
        "HausdorffSetDistanceToPositive" -> N[hp],
        "HausdorffSetDistanceToNegative" -> N[hm],
        "AlignedSupremumDistanceToPositive" -> N[sp],
        "AlignedSupremumDistanceToNegative" -> N[sm],
        "CriterionDistanceContributions" -> Association@Table[
          c -> <|
            "Positive" -> N[w[c] Total[(tripleVector[a[c]] - tripleVector[positiveIdeals[c]])^2]/3.],
            "Negative" -> N[w[c] Total[(tripleVector[a[c]] - tripleVector[negativeIdeals[c]])^2]/3.]
          |>,
          {c, criteria}
        ]
      |>
    ],
    {name, names}
  ];

  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "MethodVersion" -> "NORMATIVE-SVNN-TOPSIS-FIXED-IDEALS-V1",
    "RankingDistance" -> "WeightedNormalizedEuclideanSVNN",
    "RobustnessDiagnostics" -> {
      "TrueHausdorffSetDistance",
      "AlignedWeightedSupremumDistance"
    },
    "Weights" -> w,
    "PositiveIdeals" -> positiveIdeals,
    "NegativeIdeals" -> negativeIdeals,
    "Alternatives" -> result,
    "Winner" -> First@First@SortBy[Normal[result], -Lookup[Last[#], "Closeness"] &]
  |>
];

(* ---------- GM(1,1) ---------- *)

ClearAll[gm11Core];
Options[gm11Core] = {
  "ConditionNumberMax" -> 10.^8,
  "NearZeroA" -> 10.^-10
};

gm11Core[x_List, horizon_Integer: 3, OptionsPattern[]] := Module[
  {n = Length[x], xn, ratios, lower, upper, x1, z1, bmat, y, rank,
   sv, cond, params, a, b, epsA, x1hat, fittedX1, fittedX0,
   residuals, mrpe, s1, s2, c, p, futureX1, futureX0, forecasts,
   returnsPct, slope},

  If[n < 4, Return[fail["InsufficientData", "GM(1,1) requires at least 4 observations.", <|"Count" -> n|>]]];
  If[horizon < 1, Return[fail["InvalidHorizon", "GM forecast horizon must be at least 1."]]];
  If[!VectorQ[x, finiteRealQ], Return[fail["NonNumericData", "GM(1,1) input must be finite real numeric data."]]];
  xn = N[x];
  If[AnyTrue[xn, # <= 0 &],
    Return[fail["NonPositiveData", "This GM(1,1) implementation requires strictly positive observations for the level-ratio test."]]
  ];

  ratios = Most[xn]/Rest[xn];
  lower = Exp[-2./(n + 1)];
  upper = Exp[ 2./(n + 1)];
  If[!And @@ (lower < # < upper & /@ ratios),
    Return[fail["LevelRatioFailed",
      "Input sequence fails the configured GM(1,1) level-ratio admissibility test; no translation is silently applied.",
      <|"LevelRatios" -> ratios, "LowerBound" -> lower, "UpperBound" -> upper|>
    ]]
  ];

  x1 = Accumulate[xn];
  z1 = MovingAverage[x1, 2];
  bmat = Transpose[{-z1, ConstantArray[1., n - 1]}];
  y = Rest[xn];

  rank = MatrixRank[bmat];
  sv = SingularValueList[bmat, Tolerance -> 0];
  If[rank < 2 || Length[sv] < 2 || Min[sv] <= 0,
    Return[fail["RankDeficientDesignMatrix", "GM(1,1) design matrix is rank deficient.", <|"Rank" -> rank, "SingularValues" -> sv|>]]
  ];
  cond = Max[sv]/Min[sv];
  If[!finiteRealQ[cond] || cond > OptionValue["ConditionNumberMax"],
    Return[fail["IllConditionedDesignMatrix", "GM(1,1) design matrix exceeds the numerical condition limit.",
      <|"ConditionNumber" -> N[cond], "ConditionNumberMax" -> OptionValue["ConditionNumberMax"], "SingularValues" -> sv|>
    ]]
  ];

  params = Quiet@Check[LeastSquares[bmat, y], $Failed];
  If[params === $Failed || Length[params] != 2 || !VectorQ[params, finiteRealQ],
    Return[fail["LeastSquaresFailed", "LeastSquares did not return a valid two-parameter GM(1,1) fit."]]
  ];
  {a, b} = N[params];
  epsA = N@OptionValue["NearZeroA"];

  x1hat[k_Integer?NonNegative] := If[
    Abs[a] <= epsA,
    xn[[1]] + b k,
    (xn[[1]] - b/a) Exp[-a k] + b/a
  ];

  fittedX1 = Table[x1hat[k], {k, 0, n - 1}];
  fittedX0 = Join[{xn[[1]]}, Differences[fittedX1]];
  If[!VectorQ[fittedX0, finiteRealQ],
    Return[fail["InvalidTimeResponse", "GM(1,1) time response produced non-finite fitted values.", <|"a" -> a, "b" -> b|>]]
  ];

  residuals = xn - fittedX0;
  (* Exclude x0(1), which is fixed by construction and otherwise biases MRPE downward. *)
  mrpe = Mean[Abs[Rest[residuals]/Rest[xn]]];

  s1 = StandardDeviation[xn];
  s2 = StandardDeviation[residuals];
  c = If[s1 > 0, s2/s1, Indeterminate];
  p = If[s1 > 0,
    N[Count[Abs[residuals - Mean[residuals]], z_ /; z < 0.6745 s1]/n],
    Indeterminate
  ];

  futureX1 = Table[x1hat[k], {k, n - 1, n + horizon - 1}];
  futureX0 = Differences[futureX1];
  forecasts = N[futureX0];
  If[!VectorQ[forecasts, finiteRealQ],
    Return[fail["InvalidForecast", "GM(1,1) produced non-finite forecasts.", <|"a" -> a, "b" -> b|>]]
  ];
  returnsPct = 100. (forecasts/xn[[-1]] - 1.);
  slope = If[Length[forecasts] >= 2, N[(Last[forecasts] - First[forecasts])/(Length[forecasts] - 1)], 0.];

  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "ModelVersion" -> "GM11-LEVEL-RATIO-LS-FAIL-CLOSED-V2",
    "FitValid" -> True,
    "Count" -> n,
    "LevelRatios" -> ratios,
    "LevelRatioBounds" -> {lower, upper},
    "Rank" -> rank,
    "SingularValues" -> sv,
    "ConditionNumber" -> N[cond],
    "a" -> N[a],
    "b" -> N[b],
    "NearZeroALimitUsed" -> TrueQ[Abs[a] <= epsA],
    "AGOSequence" -> x1,
    "BackgroundSequence" -> z1,
    "DesignMatrix" -> bmat,
    "ResponseVector" -> y,
    "FittedSequence" -> N[fittedX0],
    "Residuals" -> N[residuals],
    "InSampleMRPE" -> N[mrpe],
    "PosteriorVarianceRatio" -> N[c],
    "SmallErrorProbability" -> N[p],
    "Forecast" -> forecasts,
    "ForecastReturnsPctFromLastActual" -> N[returnsPct],
    "ForecastSlopePerStep" -> slope
  |>
];

ClearAll[CalculateGM11];
Options[CalculateGM11] = Options[gm11Core];

CalculateGM11[x_List, horizon_Integer: 3, OptionsPattern[]] := Module[
  {base, n = Length[x], rolling, valid, oosAbsPct, oosMape},
  base = gm11Core[x, horizon,
    "ConditionNumberMax" -> OptionValue["ConditionNumberMax"],
    "NearZeroA" -> OptionValue["NearZeroA"]
  ];
  If[FailureQ[base], Return[base]];

  rolling = Table[
    With[{fit = gm11Core[Take[x, k], 1,
        "ConditionNumberMax" -> OptionValue["ConditionNumberMax"],
        "NearZeroA" -> OptionValue["NearZeroA"]]},
      If[FailureQ[fit],
        <|"TrainCount" -> k, "Valid" -> False, "FailureTag" -> ToString[fit[[1]]]|>,
        <|
          "TrainCount" -> k,
          "Valid" -> True,
          "Forecast" -> First[fit["Forecast"]],
          "Actual" -> N[x[[k + 1]]],
          "AbsPctError" -> N[Abs[(x[[k + 1]] - First[fit["Forecast"]])/x[[k + 1]]]]
        |>
      ]
    ],
    {k, 4, n - 1}
  ];

  valid = Select[rolling, TrueQ[#["Valid"]] &];
  oosAbsPct = If[Length[valid] > 0, Lookup[valid, "AbsPctError"], {}];
  oosMape = If[Length[oosAbsPct] > 0, Mean[oosAbsPct], Null];

  Join[
    base,
    <|
      "RollingOneStepDiagnostics" -> rolling,
      "RollingOneStepValidCount" -> Length[valid],
      "OutOfSampleMAPE" -> oosMape
    |>
  ]
];

(* ---------- Grey Relational Analysis ---------- *)

ClearAll[normalizeSequence];
normalizeSequence[x_List, method_String] := Module[{xn = N[x], mn, mx, s},
  Switch[method,
    "NONE", xn,
    "INITIAL_VALUE",
      If[Abs[First[xn]] <= 10^-15,
        fail["NormalizationFailed", "INITIAL_VALUE normalization requires non-zero first observation."],
        xn/First[xn]
      ],
    "MINMAX",
      mn = Min[xn]; mx = Max[xn];
      If[mx == mn, ConstantArray[0., Length[xn]], (xn - mn)/(mx - mn)],
    "ZSCORE",
      s = StandardDeviation[xn];
      If[s <= 0,
        fail["NormalizationFailed", "ZSCORE normalization requires positive standard deviation."],
        (xn - Mean[xn])/s
      ],
    _,
      fail["UnknownNormalization", "Normalization must be NONE, INITIAL_VALUE, MINMAX, or ZSCORE.", <|"Normalization" -> method|>]
  ]
];

ClearAll[CalculateGRA];
CalculateGRA[
  reference_List,
  candidates_Association,
  rho_?NumericQ : 0.5,
  normalization_String : "NONE",
  deltaBounds_: Automatic
] := Module[
  {n = Length[reference], ids = Keys[candidates], rn, cn, bad, diffs,
   flat, dmin, dmax, coeffs, grades, degenerate},

  If[n == 0 || Length[ids] == 0,
    Return[fail["InsufficientData", "GRA requires a reference sequence and at least one candidate."]]
  ];
  If[!VectorQ[reference, finiteRealQ],
    Return[fail["NonNumericData", "GRA reference sequence must contain only finite real values."]]
  ];
  If[!finiteRealQ[rho] || !(0 < N[rho] <= 1),
    Return[fail["InvalidRho", "GRA resolution coefficient rho must satisfy 0 < rho <= 1."]]
  ];
  If[AnyTrue[ids, Length[candidates[#]] != n &],
    Return[fail["LengthMismatch", "Every GRA candidate must be exactly aligned to the reference length; missing values are never replaced by zero."]]
  ];
  If[!And @@ (VectorQ[candidates[#], finiteRealQ] & /@ ids),
    Return[fail["NonNumericData", "GRA candidates must contain only finite real values."]]
  ];

  rn = normalizeSequence[reference, normalization];
  If[FailureQ[rn], Return[rn]];
  cn = Association@Table[
    id -> normalizeSequence[candidates[id], normalization],
    {id, ids}
  ];
  bad = Cases[cn, _Failure, Infinity];
  If[Length[bad] > 0, Return[First[bad]]];

  diffs = Association@Table[id -> Abs[rn - cn[id]], {id, ids}];
  flat = Flatten[Values[diffs]];

  If[deltaBounds === Automatic,
    dmin = Min[flat]; dmax = Max[flat],
    If[!MatchQ[deltaBounds, {_?NumericQ, _?NumericQ}] ||
       !VectorQ[N@deltaBounds, finiteRealQ] ||
       deltaBounds[[1]] < 0 || deltaBounds[[2]] < deltaBounds[[1]],
      Return[fail["InvalidDeltaBounds", "Normative GRA delta bounds must be {nonnegativeMin, max>=min}."]]
    ];
    {dmin, dmax} = N@deltaBounds;
    If[AnyTrue[flat, # < dmin - 10^-12 || # > dmax + 10^-12 &],
      Return[fail["DeltaBoundsExceeded", "Observed GRA difference lies outside the fixed normative calibration bounds.",
        <|"ObservedMin" -> Min[flat], "ObservedMax" -> Max[flat], "DeltaBounds" -> {dmin, dmax}|>
      ]]
    ];
  ];

  degenerate = TrueQ[dmax == dmin];
  coeffs = Association@Table[
    id -> If[
      degenerate,
      ConstantArray[1., n],
      N[(dmin + N[rho] dmax)/(diffs[id] + N[rho] dmax)]
    ],
    {id, ids}
  ];
  grades = AssociationMap[Mean, coeffs];

  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "MethodVersion" -> "GRA-ALIGNED-NO-IMPUTATION-V2",
    "Normalization" -> normalization,
    "Rho" -> N[rho],
    "DeltaMode" -> If[deltaBounds === Automatic, "CROSS_SECTIONAL", "NORMATIVE_FIXED"],
    "DeltaMin" -> N[dmin],
    "DeltaMax" -> N[dmax],
    "DegenerateDeltaRange" -> degenerate,
    "RelationalCoefficients" -> coeffs,
    "RelationalGrades" -> grades
  |>
];

(* ---------- Wasserstein-1 ---------- *)

ClearAll[Wasserstein1D];
Wasserstein1D[a_List, b_List] := Module[{an, bn, m, p, qa, qb},
  If[Length[a] == 0 || Length[b] == 0 ||
     !VectorQ[a, finiteRealQ] || !VectorQ[b, finiteRealQ],
    Return[fail["InvalidSamples", "Wasserstein1D requires two non-empty finite real samples."]]
  ];
  an = N[a]; bn = N[b];
  m = Max[Length[an], Length[bn], 100];
  p = (Range[m] - 0.5)/m;
  qa = Quantile[an, p];
  qb = Quantile[bn, p];
  N[Mean[Abs[qa - qb]]]
];

(* ---------- Gaussian HMM, scaled Baum-Welch ---------- *)

ClearAll[normalPDFSafe];
normalPDFSafe[x_, mu_, sigma_] := Max[10.^-300, PDF[NormalDistribution[mu, Max[sigma, 10.^-8]], x]];

ClearAll[gaussianHMMCore];
Options[gaussianHMMCore] = {
  "States" -> 5,
  "MaxIterations" -> 200,
  "Tolerance" -> 10.^-7,
  "MinSigma" -> 10.^-6
};

gaussianHMMCore[data_List, OptionsPattern[]] := Module[
  {x = N[data], n, k, maxIter, tol, minSigma, pi, trans, means, sigmas,
   emissions, alpha, beta, scales, gamma, xi, logLik = -Infinity,
   prevLogLik = -Infinity, iter = 0, denom, rowDen, j, t, i,
   quantiles, overallSd, converged = False, newTrans, latest},

  n = Length[x];
  k = OptionValue["States"];
  maxIter = OptionValue["MaxIterations"];
  tol = N@OptionValue["Tolerance"];
  minSigma = N@OptionValue["MinSigma"];

  If[!IntegerQ[k] || k < 2,
    Return[fail["InvalidStateCount", "HMM state count must be an integer >= 2."]]
  ];
  If[n < Max[50, 10 k],
    Return[fail["InsufficientData", "Gaussian HMM requires at least max(50, 10*states) returns.", <|"Count" -> n, "States" -> k|>]]
  ];
  If[!VectorQ[x, finiteRealQ],
    Return[fail["NonNumericData", "HMM return history must be finite real data."]]
  ];
  overallSd = StandardDeviation[x];
  If[overallSd <= minSigma,
    Return[fail["DegenerateData", "HMM input variance is too small to identify Gaussian states."]]
  ];

  quantiles = Quantile[x, N[(Range[k] - 0.5)/k]];
  means = N[quantiles];
  sigmas = ConstantArray[Max[overallSd/2., minSigma], k];
  pi = ConstantArray[1./k, k];
  trans = Table[If[i == j, 0.80, 0.20/(k - 1)], {i, k}, {j, k}];

  While[iter < maxIter && !converged,
    iter++;
    emissions = Table[normalPDFSafe[x[[t]], means[[j]], sigmas[[j]]], {t, n}, {j, k}];

    alpha = ConstantArray[0., {n, k}];
    scales = ConstantArray[0., n];
    alpha[[1]] = pi emissions[[1]];
    scales[[1]] = Total[alpha[[1]]];
    If[scales[[1]] <= 0, Return[fail["HMMUnderflow", "Forward probability scale collapsed at t=1."]]];
    alpha[[1]] /= scales[[1]];

    Do[
      alpha[[t]] = (alpha[[t - 1]].trans) emissions[[t]];
      scales[[t]] = Total[alpha[[t]]];
      If[scales[[t]] <= 0, Return[fail["HMMUnderflow", "Forward probability scale collapsed.", <|"Index" -> t|>]]];
      alpha[[t]] /= scales[[t]],
      {t, 2, n}
    ];

    prevLogLik = logLik;
    logLik = Total[Log[scales]];

    beta = ConstantArray[0., {n, k}];
    beta[[n]] = ConstantArray[1., k];
    Do[
      beta[[t]] = trans . (emissions[[t + 1]] beta[[t + 1]])/scales[[t + 1]],
      {t, n - 1, 1, -1}
    ];

    gamma = Table[
      denom = Total[alpha[[t]] beta[[t]]];
      If[denom <= 0, ConstantArray[1./k, k], (alpha[[t]] beta[[t]])/denom],
      {t, n}
    ];

    xi = Table[
      With[{raw = Table[
          alpha[[t, i]] trans[[i, j]] emissions[[t + 1, j]] beta[[t + 1, j]],
          {i, k}, {j, k}]},
        If[Total[raw] <= 0, ConstantArray[1./(k k), {k, k}], raw/Total[raw]]
      ],
      {t, n - 1}
    ];

    pi = gamma[[1]];
    newTrans = Table[
      rowDen = Total[gamma[[1 ;; n - 1, i]]];
      If[rowDen <= 0,
        trans[[i, j]],
        Total[xi[[All, i, j]]]/rowDen
      ],
      {i, k}, {j, k}
    ];
    trans = Map[If[Total[#] > 0, #/Total[#], ConstantArray[1./k, k]] &, newTrans];

    Do[
      denom = Total[gamma[[All, j]]];
      If[denom > 0,
        means[[j]] = Total[gamma[[All, j]] x]/denom;
        sigmas[[j]] = Max[minSigma,
          Sqrt[Total[gamma[[All, j]] (x - means[[j]])^2]/denom]
        ];
      ],
      {j, k}
    ];

    If[finiteRealQ[prevLogLik] && Abs[logLik - prevLogLik] <= tol (1 + Abs[prevLogLik]),
      converged = True
    ];
  ];

  latest = gamma[[-1]];
  <|
    "Converged" -> converged,
    "Iterations" -> iter,
    "LogLikelihood" -> N[logLik],
    "InitialProbabilities" -> N[pi],
    "TransitionMatrix" -> N[trans],
    "Means" -> N[means],
    "Sigmas" -> N[sigmas],
    "LatestPosteriorByStateIndex" -> N[latest],
    "AllPosteriorProbabilities" -> N[gamma]
  |>
];

ClearAll[semanticStateMapping];
semanticStateMapping[means_List, sigmas_List] := Module[
  {k = Length[means], remaining, bull, bear, choppy, range, transitional, mapping, valid},
  If[k != 5, Return[fail["SemanticMappingRequiresFiveStates", "Named crypto regime mapping currently requires exactly five HMM states."]]];
  remaining = Range[k];
  bull = First@Ordering[means, -1];
  bear = First@Ordering[means, 1];
  remaining = Complement[remaining, {bull, bear}];
  choppy = remaining[[First@Ordering[sigmas[[remaining]], -1]]];
  remaining = Complement[remaining, {choppy}];
  range = remaining[[First@Ordering[sigmas[[remaining]], 1]]];
  remaining = Complement[remaining, {range}];
  transitional = First[remaining];
  valid = means[[bull]] > 0 && means[[bear]] < 0;
  mapping = <|
    "TRENDING_BULL" -> bull,
    "TRENDING_BEAR" -> bear,
    "CHOPPY" -> choppy,
    "RANGE" -> range,
    "TRANSITIONAL" -> transitional
  |>;
  <|"Mapping" -> mapping, "SemanticMappingValid" -> valid|>
];

ClearAll[FitGaussianHMMRegime];
Options[FitGaussianHMMRegime] = Options[gaussianHMMCore];

FitGaussianHMMRegime[returns_List, OptionsPattern[]] := Module[
  {fit, map, mapping, latest, probs, current, n, recent, m, ps, w1, stateSamples},
  fit = gaussianHMMCore[returns,
    "States" -> OptionValue["States"],
    "MaxIterations" -> OptionValue["MaxIterations"],
    "Tolerance" -> OptionValue["Tolerance"],
    "MinSigma" -> OptionValue["MinSigma"]
  ];
  If[FailureQ[fit], Return[fit]];
  map = semanticStateMapping[fit["Means"], fit["Sigmas"]];
  If[FailureQ[map], Return[map]];
  mapping = map["Mapping"];
  latest = fit["LatestPosteriorByStateIndex"];
  probs = AssociationMap[N[latest[[mapping[#]]]] &, Keys[mapping]];
  current = First@First@SortBy[Normal[probs], -Last[#] &];

  n = Length[returns];
  recent = N@Take[returns, -Min[20, n]];
  m = Max[Length[recent], 100];
  ps = (Range[m] - 0.5)/m;
  w1 = AssociationMap[
    Function[label,
      With[{idx = mapping[label],
            stateQ = Quantile[NormalDistribution[fit["Means"][[mapping[label]]], fit["Sigmas"][[mapping[label]]]], ps],
            recentQ = Quantile[recent, ps]},
        N[Mean[Abs[recentQ - stateQ]]]
      ]
    ],
    Keys[mapping]
  ];

  Join[
    <|
      "MathVersion" -> $SigmaLuiMathVersion,
      "ModelVersion" -> "GAUSSIAN-HMM-BAUM-WELCH-SCALED-V1",
      "SemanticMapping" -> mapping,
      "SemanticMappingValid" -> map["SemanticMappingValid"],
      "CurrentRegime" -> current,
      "LatestPosterior" -> probs,
      "RecentWindowCount" -> Length[recent],
      "Wasserstein1ToRegimeEmission" -> w1
    |>,
    fit
  ]
];

(* ---------- Historical Expected Shortfall ---------- *)

ClearAll[HistoricalExpectedShortfall];
HistoricalExpectedShortfall[losses_List, alpha_?NumericQ : 0.95] := Module[
  {x = N[losses], a = N[alpha], var, tail},
  If[!VectorQ[x, finiteRealQ] || Length[x] < 2,
    Return[fail["InvalidLossSeries", "Expected Shortfall requires at least two finite real loss observations."]]
  ];
  If[!(0 < a < 1),
    Return[fail["InvalidAlpha", "Expected Shortfall alpha must satisfy 0 < alpha < 1."]]
  ];
  If[(1 - a) Length[x] < 1,
    Return[fail["InsufficientTailData", "Observed loss series is too short to contain even one nominal tail observation at this alpha.",
      <|"Count" -> Length[x], "Alpha" -> a|>
    ]]
  ];
  var = Quantile[x, a];
  tail = Select[x, # >= var &];
  If[Length[tail] == 0,
    Return[fail["EmptyTail", "No observations were selected into the historical ES tail."]]
  ];
  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "MethodVersion" -> "HISTORICAL-EXPECTED-SHORTFALL-V1",
    "Alpha" -> a,
    "Count" -> Length[x],
    "VaR" -> N[var],
    "ExpectedShortfall" -> N[Mean[tail]],
    "TailCount" -> Length[tail],
    "TailFractionObserved" -> N[Length[tail]/Length[x]]
  |>
];


ClearAll[jsonSafe];
jsonSafe[x_] := x /. {
  Missing[__] -> Null,
  Indeterminate -> Null,
  ComplexInfinity -> Null,
  DirectedInfinity[_] -> Null
};

(* ---------- JSON dispatcher ---------- *)

ClearAll[successEnvelope, failureEnvelope];
successEnvelope[x_Association] := Join[<|"ok" -> True, "mathVersion" -> $SigmaLuiMathVersion|>, x];
failureEnvelope[f_Failure] := <|
  "ok" -> False,
  "mathVersion" -> $SigmaLuiMathVersion,
  "failure" -> <|
    "tag" -> ToString[f[[1]]],
    "details" -> f[[2]]
  |>
|>;

ClearAll[VerifyDecisionTrace];
VerifyDecisionTrace[trace_Association] := Module[
  {t, i, f, score, acc, expectedScore, expectedAcc, dp, dm, closeness,
   expectedCloseness, neutroOk, topsisOk, tier, decisionId, quorum, gates,
   expectedTier, tierOk},
  decisionId = ToString@Lookup[trace, "decisionId", Lookup[trace, "id", "UNKNOWN"]];
  tier = ToString@Lookup[trace, "tier", "NO_TRADE"];
  
  (* 1. Verify Neutrosophic Triple *)
  t = N@Lookup[Lookup[trace, "neutrosophic", <||>], "T", 0.];
  i = N@Lookup[Lookup[trace, "neutrosophic", <||>], "I", 0.];
  f = N@Lookup[Lookup[trace, "neutrosophic", <||>], "F", 0.];
  score = N@Lookup[Lookup[trace, "neutrosophic", <||>], "score", 0.];
  acc = N@Lookup[Lookup[trace, "neutrosophic", <||>], "accuracy", 0.];
  
  expectedScore = (2. + t - i - f)/3.;
  expectedAcc = t - f;
  neutroOk = Abs[score - expectedScore] < 10.^-3 && Abs[acc - expectedAcc] < 10.^-3;

  (* 2. Verify TOPSIS closeness *)
  dp = N@Lookup[Lookup[trace, "topsis", <||>], "dPlus", 0.];
  dm = N@Lookup[Lookup[trace, "topsis", <||>], "dMinus", 0.];
  closeness = N@Lookup[Lookup[trace, "topsis", <||>], "closeness", 0.];
  expectedCloseness = If[dp + dm > 0., dm/(dp + dm), 0.];
  topsisOk = Abs[closeness - expectedCloseness] < 10.^-3;

  (* 3. Verify Conjunctive Tiering *)
  quorum = ToString@Lookup[Lookup[trace, "crossVenue", <||>], "quorum", "0/3"];
  gates = Lookup[trace, "hardGates", <||>];
  expectedTier = Which[
    closeness >= 0.9800 && quorum == "3/3" && i < 0.12 &&
      TrueQ@Lookup[gates, "basis", False] && TrueQ@Lookup[gates, "dataFreshness", False] &&
      TrueQ@Lookup[gates, "venueIntegrity", False] && TrueQ@Lookup[gates, "fractal", False] &&
      TrueQ@Lookup[gates, "wassersteinRegime", False] && TrueQ@Lookup[gates, "expectedShortfall", False] &&
      TrueQ@Lookup[gates, "kaikoVacuum", False],
    "APEX_SOVEREIGN",
    closeness >= 0.9500 && TrueQ@Lookup[gates, "dataFreshness", False] && TrueQ@Lookup[gates, "basis", False],
    "HIGH_CONFLUENCE",
    closeness >= 0.9400,
    "ALPHA_PRIME",
    True,
    "NO_TRADE"
  ];
  tierOk = (tier == expectedTier);

  <|
    "decisionId" -> decisionId,
    "verified" -> (neutroOk && topsisOk && tierOk),
    "tolerancesMet" -> (neutroOk && topsisOk),
    "tierVerified" -> tierOk,
    "assignedTier" -> tier,
    "expectedTier" -> expectedTier,
    "neutrosophicReproduced" -> <|"score" -> expectedScore, "accuracy" -> expectedAcc, "match" -> neutroOk|>,
    "topsisReproduced" -> <|"closeness" -> expectedCloseness, "dPlus" -> dp, "dMinus" -> dm, "match" -> topsisOk|>
  |>
];

ClearAll[SigmaLuiMathRequest];
SigmaLuiMathRequest[request_Association] := Module[{op, p, r, bounds},
  op = ToUpperCase@ToString@Lookup[request, "op", ""];
  p = Lookup[request, "payload", <||>];

  r = Quiet@Check[
    Switch[op,
      "HEALTH",
        <|"Status" -> "OK"|>,
      "VERIFY_DECISION_TRACE",
        VerifyDecisionTrace[Lookup[p, "trace", p]],
      "STSVNWA",
        CalculateSTSVNWA[Lookup[p, "triples", {}]],
      "TCNS",
        CalculateTCNS[
          Lookup[p, "triple", <||>],
          Lookup[p, "dataAgeSeconds", -1],
          Lookup[p, "halfLifeSeconds", 180.]
        ],
      "NAHP",
        CalculateNAHP[Lookup[p, "pairwiseMatrix", {}]],
      "TOPSIS",
        CalculateNormativeTOPSIS[
          Lookup[p, "alternatives", <||>],
          Lookup[p, "weights", <||>],
          Lookup[p, "positiveIdeals", <||>],
          Lookup[p, "negativeIdeals", <||>]
        ],
      "GM11",
        CalculateGM11[
          Lookup[p, "sequence", {}],
          Round@Lookup[p, "horizon", 3],
          "ConditionNumberMax" -> Lookup[p, "conditionNumberMax", 10.^8]
        ],
      "GRA",
        bounds = Lookup[p, "deltaBounds", Automatic];
        CalculateGRA[
          Lookup[p, "reference", {}],
          Lookup[p, "candidates", <||>],
          Lookup[p, "rho", 0.5],
          ToUpperCase@ToString@Lookup[p, "normalization", "NONE"],
          bounds
        ],
      "WASSERSTEIN1",
        Wasserstein1D[Lookup[p, "a", {}], Lookup[p, "b", {}]],
      "HMM_REGIME",
        FitGaussianHMMRegime[
          Lookup[p, "returns", {}],
          "States" -> Round@Lookup[p, "states", 5],
          "MaxIterations" -> Round@Lookup[p, "maxIterations", 200]
        ],
      "EXPECTED_SHORTFALL",
        HistoricalExpectedShortfall[
          Lookup[p, "losses", {}],
          Lookup[p, "alpha", 0.95]
        ],
      _,
        fail["UnknownOperation", "Unknown SigmaLui mathematical operation.", <|"Operation" -> op|>]
    ],
    fail["UnhandledMathError", "The Wolfram mathematical authority encountered an unhandled evaluation error.", <|"Operation" -> op|>]
  ];

  If[FailureQ[r], failureEnvelope[r],
    If[AssociationQ[r], successEnvelope[r],
      successEnvelope[<|"Result" -> r|>]
    ]
  ]
];

(* ---------- deterministic self-tests ---------- *)

ClearAll[SigmaLuiMathSelfTest];
SigmaLuiMathSelfTest[] := Module[
  {equalAHP, top, gm, gra, w1, es, tcns, tests, synthetic, hmm},
  equalAHP = CalculateNAHP[ConstantArray[1., {3, 3}]];
  top = CalculateNormativeTOPSIS[
    <|
      "LONG" -> <|"c1" -> <|"T" -> 1., "I" -> 0., "F" -> 0.|>|>,
      "SHORT" -> <|"c1" -> <|"T" -> 0., "I" -> 1., "F" -> 1.|>|>
    |>,
    <|"c1" -> 1.|>,
    <|"c1" -> <|"T" -> 1., "I" -> 0., "F" -> 0.|>|>,
    <|"c1" -> <|"T" -> 0., "I" -> 1., "F" -> 1.|>|>
  ];
  gm = CalculateGM11[{100., 104., 108., 112., 116., 120.}, 3];
  gra = CalculateGRA[{1., 2., 3.}, <|"A" -> {1., 2., 3.}|>, 0.5, "NONE"];
  w1 = Wasserstein1D[{1., 2., 3.}, {1., 2., 3.}];
  es = HistoricalExpectedShortfall[N@Range[100], 0.95];
  tcns = CalculateTCNS[<|"T" -> 0.7, "I" -> 0.2, "F" -> 0.1|>, 0., 180.];

  SeedRandom[20260905];
  synthetic = Join[
    RandomVariate[NormalDistribution[0.002, 0.003], 60],
    RandomVariate[NormalDistribution[-0.002, 0.003], 60],
    RandomVariate[NormalDistribution[0., 0.001], 60],
    RandomVariate[NormalDistribution[0., 0.012], 60],
    RandomVariate[NormalDistribution[0.0002, 0.005], 60]
  ];
  hmm = FitGaussianHMMRegime[synthetic];

  tests = <|
    "AHP_equal_weights" -> (!FailureQ[equalAHP] && Max[Abs[equalAHP["Weights"] - ConstantArray[1/3., 3]]] < 10^-8),
    "AHP_CR_zero" -> (!FailureQ[equalAHP] && Abs[equalAHP["CR"]] < 10^-10),
    "TOPSIS_positive_ideal_is_one" -> (!FailureQ[top] && Abs[top["Alternatives", "LONG", "Closeness"] - 1.] < 10^-10),
    "TOPSIS_negative_ideal_is_zero" -> (!FailureQ[top] && Abs[top["Alternatives", "SHORT", "Closeness"]] < 10^-10),
    "GM11_valid_fit" -> (!FailureQ[gm] && TrueQ[gm["FitValid"]]),
    "GM11_bad_level_ratio_fails" -> FailureQ[CalculateGM11[{1., 100., 1., 100.}]],
    "GRA_exact_match_grade_one" -> (!FailureQ[gra] && Abs[gra["RelationalGrades", "A"] - 1.] < 10^-10),
    "GRA_length_mismatch_fails" -> FailureQ[CalculateGRA[{1., 2., 3.}, <|"A" -> {1., 2.}|>]],
    "W1_identity_zero" -> (!FailureQ[w1] && Abs[w1] < 10^-10),
    "ES_not_below_VaR" -> (!FailureQ[es] && es["ExpectedShortfall"] >= es["VaR"]),
    "TCNS_age_zero_identity" -> (!FailureQ[tcns] && Max[Abs[Lookup[tcns, {"T", "I", "F"}] - {0.7, 0.2, 0.1}]] < 10^-10),
    "HMM_probabilities_sum_one" -> (!FailureQ[hmm] && Abs[Total[Values[hmm["LatestPosterior"]]] - 1.] < 10^-6)
  |>;

  <|
    "MathVersion" -> $SigmaLuiMathVersion,
    "Passed" -> And @@ Values[tests],
    "Tests" -> tests
  |>
];

End[];
EndPackage[];

(* CLI mode:
   wolframscript -file SigmaLuiMath.wl --request /path/request.json
   wolframscript -file SigmaLuiMath.wl --self-test
*)

If[MemberQ[$ScriptCommandLine, "--self-test"],
  Print[ExportString[SigmaLuiMath`Private`jsonSafe[SigmaLuiMath`SigmaLuiMathSelfTest[]], "RawJSON"]];
  Exit[];
];

Module[{pos, requestPath, request, response},
  pos = FirstPosition[$ScriptCommandLine, "--request"];
  If[pos =!= Missing["NotFound"],
    If[pos[[1]] >= Length[$ScriptCommandLine],
      Print[ExportString[<|"ok" -> False, "failure" -> <|"tag" -> "MissingRequestPath"|>|>, "RawJSON"]];
      Exit[2];
    ];
    requestPath = $ScriptCommandLine[[pos[[1]] + 1]];
    request = Quiet@Check[Import[requestPath, "RawJSON"], $Failed];
    If[request === $Failed || !AssociationQ[request],
      Print[ExportString[<|"ok" -> False, "failure" -> <|"tag" -> "InvalidRequestJSON"|>|>, "RawJSON"]];
      Exit[2];
    ];
    response = SigmaLuiMath`SigmaLuiMathRequest[request];
    Print[ExportString[SigmaLuiMath`Private`jsonSafe[response], "RawJSON"]];
  ];
];
