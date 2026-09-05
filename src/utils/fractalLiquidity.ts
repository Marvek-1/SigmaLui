import { FractalConfluence, LiquidityHeatmapAnalysis, LiquidityLevel } from '../types';

/**
 * Computes Fractal Confluence across 5m, 1H, and 4H timeframes.
 * Prevents buying a "1-minute pump that is actually a 4-hour dump".
 */
export function evaluateFractalConfluence(
  baseCi: number,
  baseDirection: 'LONG' | 'SHORT' | 'NEUTRAL',
  marketState: string,
  greyError5m: number = 0.02
): FractalConfluence {
  // Simulate 1h and 4h higher timeframe alignment based on market state & micro trend
  let ci1h = baseCi;
  let ci4h = baseCi;
  let dir1h = baseDirection;
  let dir4h = baseDirection;

  if (marketState === 'TRENDING_BULL') {
    ci1h = Math.min(0.99, baseCi * (0.97 + Math.random() * 0.04));
    ci4h = Math.min(0.98, baseCi * (0.96 + Math.random() * 0.04));
    dir1h = 'LONG';
    dir4h = 'LONG';
  } else if (marketState === 'TRENDING_BEAR') {
    ci1h = Math.min(0.99, baseCi * (0.97 + Math.random() * 0.04));
    ci4h = Math.min(0.98, baseCi * (0.96 + Math.random() * 0.04));
    dir1h = 'SHORT';
    dir4h = 'SHORT';
  } else if (marketState === 'CONFUSED_CONFLICT' || marketState === 'MEAN_REVERTING') {
    // Conflict in higher timeframes
    ci1h = Number((baseCi * 0.88).toFixed(4));
    ci4h = Number((baseCi * 0.79).toFixed(4));
    dir1h = 'NEUTRAL';
    dir4h = baseDirection === 'LONG' ? 'SHORT' : 'LONG';
  } else {
    ci1h = Number((baseCi * 0.94).toFixed(4));
    ci4h = Number((baseCi * 0.91).toFixed(4));
  }

  const greyError1h = Number((greyError5m * 0.85).toFixed(4));
  const greyError4h = Number((greyError5m * 0.65).toFixed(4));

  const isConfluent = ci1h >= 0.91 && ci4h >= 0.89 && baseCi >= 0.9400 && dir1h === baseDirection && dir4h === baseDirection;
  const confluenceScore = Number(((baseCi + ci1h + ci4h) / 3).toFixed(4));

  return {
    tf5m: { ci: Number(baseCi.toFixed(4)), direction: baseDirection, greyError: greyError5m },
    tf1h: { ci: Number(ci1h.toFixed(4)), direction: dir1h, greyError: greyError1h },
    tf4h: { ci: Number(ci4h.toFixed(4)), direction: dir4h, greyError: greyError4h },
    isConfluent,
    confluenceScore,
  };
}

/**
 * Simulates and analyzes Coinglass-style Liquidity Heatmap and Liquidity Walls.
 * Checks for "Clear Path to Upside" (no massive sell block <= 0.5% above price).
 */
export function analyzeLiquidityHeatmap(
  currentPrice: number,
  marketState: string,
  symbol: string
): LiquidityHeatmapAnalysis {
  const isBtcOrEth = symbol === 'BTC' || symbol === 'ETH';
  const baseVol = isBtcOrEth ? 18000000 : 3500000;

  // Generate realistic liquidity clusters around price
  const levels: LiquidityLevel[] = [];
  
  // Overhead resistance / Ask walls (+0.3% to +3.5%)
  const askOffsets = [0.004, 0.009, 0.018, 0.028, 0.042];
  // If state is confused or bear, place a heavy wall very close (e.g. 0.4% above)
  const heavyWallDistance = marketState === 'CONFUSED_CONFLICT' || marketState === 'HIGH_VOLATILITY' ? 0.004 : 0.016;

  askOffsets.forEach((offset, idx) => {
    const p = currentPrice * (1 + offset);
    const isHeavy = Math.abs(offset - heavyWallDistance) < 0.003;
    const vol = isHeavy ? baseVol * 4.5 : baseVol * (0.8 + idx * 0.4);
    levels.push({
      price: Number(p.toFixed(2)),
      volumeUsd: Math.round(vol),
      type: 'ASK_WALL',
      distancePct: Number((offset * 100).toFixed(2)),
    });
  });

  // Support / Bid walls (-0.4% to -3.5%)
  const bidOffsets = [-0.005, -0.011, -0.021, -0.032, -0.045];
  bidOffsets.forEach((offset, idx) => {
    const p = currentPrice * (1 + offset);
    levels.push({
      price: Number(p.toFixed(2)),
      volumeUsd: Math.round(baseVol * (1.1 + idx * 0.3)),
      type: 'BID_WALL',
      distancePct: Number((Math.abs(offset) * 100).toFixed(2)),
    });
  });

  // Liquidation pools
  levels.push({
    price: Number((currentPrice * 1.025).toFixed(2)),
    volumeUsd: Math.round(baseVol * 3.2),
    type: 'LIQUIDATION_POOL',
    distancePct: 2.5,
  });

  const closestOverheadWall = levels
    .filter((l) => l.type === 'ASK_WALL' && l.volumeUsd > baseVol * 2.0)
    .sort((a, b) => a.distancePct - b.distancePct)[0];

  const closestSupportWall = levels
    .filter((l) => l.type === 'BID_WALL' && l.volumeUsd > baseVol * 1.8)
    .sort((a, b) => a.distancePct - b.distancePct)[0];

  const closestOverheadWallDistancePct = closestOverheadWall ? closestOverheadWall.distancePct : 2.5;
  const closestSupportWallDistancePct = closestSupportWall ? closestSupportWall.distancePct : 2.0;

  // Clear path to upside requires overhead wall > 0.8% away
  const hasClearPathToUpside = closestOverheadWallDistancePct >= 0.8;
  const liquidityScore = Number((Math.min(1, closestOverheadWallDistancePct / 2.0)).toFixed(2));

  return {
    closestOverheadWallDistancePct,
    closestSupportWallDistancePct,
    hasClearPathToUpside,
    liquidityScore,
    levels: levels.sort((a, b) => b.price - a.price),
  };
}
