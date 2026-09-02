import React, { useState } from 'react';
import { AssetDataFeed } from '../types';
import { FuturesUniverseView } from './FuturesUniverseView';
import { FractalLiquidityView } from './FractalLiquidityView';
import { Coins, Layers } from 'lucide-react';

interface MarketRadarViewProps {
  assets: AssetDataFeed[];
  marketState: string;
  onRefresh: () => void;
  onAuditPair?: (pairSymbol: string) => void;
  activeSubTab?: MarketSubTab;
  onSubTabChange?: (subTab: MarketSubTab) => void;
}

type MarketSubTab = 'UNIVERSE' | 'ORDERBOOK_DEPTH';

export const MarketRadarView: React.FC<MarketRadarViewProps> = ({
  assets,
  marketState,
  onRefresh,
  onAuditPair,
  activeSubTab,
  onSubTabChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<MarketSubTab>('UNIVERSE');
  const subTab = activeSubTab !== undefined ? activeSubTab : internalSubTab;

  const handleSetSubTab = (tab: MarketSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Sub-navigation bar for Market Radar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-2 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSetSubTab('UNIVERSE')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'UNIVERSE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>30+ Perpetuals Universe (6 Sectors)</span>
          </button>

          <button
            onClick={() => handleSetSubTab('ORDERBOOK_DEPTH')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'ORDERBOOK_DEPTH'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Orderbook Depth & Slippage Gate</span>
          </button>
        </div>

        <div className="text-slate-400 text-[11px] font-mono pr-2 hidden sm:block">
          Sectors: Mega-Cap &bull; L1/L2 &bull; AI/Compute &bull; DeFi &bull; Meme &bull; Infra
        </div>
      </div>

      {/* Sub-view Content */}
      <div>
        {subTab === 'UNIVERSE' && (
          <FuturesUniverseView
            pairs={assets}
            onRefresh={onRefresh}
            onAuditPair={onAuditPair}
          />
        )}
        {subTab === 'ORDERBOOK_DEPTH' && (
          <FractalLiquidityView assets={assets} marketState={marketState} />
        )}
      </div>
    </div>
  );
};
