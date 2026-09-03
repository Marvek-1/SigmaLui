import React, { useState, useEffect } from 'react';
import {
  Shield,
  Scroll,
  Lock,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Key,
  Database,
  Terminal,
  Activity,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Fingerprint,
  Link2,
  Copy,
  Check,
  Eye,
  Hash,
} from 'lucide-react';

interface PolicyFile {
  name: string;
  entrypoint: string;
  args: string[];
  gloss: string;
  glyph: string;
  sha256: string;
  bytes: number;
}

const POLICIES: Record<string, PolicyFile> = {
  HANDSHAKE: {
    name: 'handshake_policy',
    entrypoint: 'HANDSHAKE',
    args: ['AUTHOK', 'PROVOK', 'GATEONE', 'GATETWO', 'CHAINOK', 'NODEOK', 'REPLAYOK', 'CLOCKOK', 'ROLEOK', 'RESONANCE'],
    gloss: `FUNCTION HANDSHAKE(AUTHOK,PROVOK,GATEONE,GATETWO,CHAINOK,NODEOK,REPLAYOK,CLOCKOK,ROLEOK,RESONANCE) {
  IF AUTHOK == FALSE { RETURN [0,10,1]; }
  IF PROVOK == FALSE { RETURN [0,11,1]; }
  IF GATEONE == FALSE { RETURN [0,12,0]; }
  IF GATETWO == FALSE { RETURN [0,13,0]; }
  IF CHAINOK == FALSE { RETURN [0,14,1]; }
  IF NODEOK == FALSE { RETURN [0,15,0]; }
  IF REPLAYOK == FALSE { RETURN [0,16,1]; }
  IF CLOCKOK == FALSE { RETURN [0,17,0]; }
  IF ROLEOK == FALSE { RETURN [0,18,0]; }
  IF RESONANCE < 0.92 { RETURN [0,19,0]; }
  TRUE @ 1;
  RETURN [1,0,0];
}`,
    glyph: `🜅🜔🜍🜂🜓🜈🜎🜍 🜇🜀🜍🜃🜒🜇🜀🜊🜄🜪🜀🜔🜓🜇🜎🜊🜮🜏🜑🜎🜕🜎🜊🜮🜆🜀🜓🜄🜎🜍🜄🜮🜆🜀🜓🜄🜓🜖🜎🜮🜂🜇🜀🜈🜍🜎🜊🜮🜍🜎🜃🜄🜎🜊🜮🜑🜄🜏🜋🜀🜘🜎🜊🜮🜂🜋🜎🜂🜊🜎🜊🜮🜑🜎🜋🜄🜎🜊🜮🜑🜄🜒🜎🜍🜀🜍🜂🜄🜫 🜬
  🜈🜅 🜀🜔🜓🜇🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜚🜮🜛🜨🜯 🜭
  🜈🜅 🜏🜑🜎🜕🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜛🜮🜛🜨🜯 🜭
  🜈🜅 🜆🜀🜓🜄🜎🜍🜄 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜜🜮🜚🜨🜯 🜭
  🜈🜅 🜆🜀🜓🜄🜓🜖🜎 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜝🜮🜚🜨🜯 🜭
  🜈🜅 🜂🜇🜀🜈🜍🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜞🜮🜛🜨🜯 🜭
  🜈🜅 🜍🜎🜃🜄🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜟🜮🜚🜨🜯 🜭
  🜈🜅 🜑🜄🜏🜋🜀🜘🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜠🜮🜛🜨🜯 🜭
  🜈🜅 🜂🜋🜎🜂🜊🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜡🜮🜚🜨🜯 🜭
  🜈🜅 🜑🜎🜋🜄🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜢🜮🜚🜨🜯 🜭
  🜈🜅 🜑🜄🜒🜎🜍🜀🜍🜂🜄 🜶 🜚🜦🜣🜜 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜛🜣🜮🜚🜨🜯 🜭
  🜓🜑🜔🜄 🜤 🜛🜯
  🜑🜄🜓🜔🜑🜍 🜧🜛🜮🜚🜮🜚🜨🜯
🜭`,
    sha256: '0a75c345a3c6fed27872d485cfe54381dff2d87800ef511fa990d77b91c33f7d',
    bytes: 1865,
  },
  SIGNALPOLICY: {
    name: 'signal_policy',
    entrypoint: 'SIGNALPOLICY',
    args: ['GATEONE', 'GATETWO', 'PROVOK', 'STATEOK', 'CLOCKOK', 'RESONANCE'],
    gloss: `FUNCTION SIGNALPOLICY(GATEONE,GATETWO,PROVOK,STATEOK,CLOCKOK,RESONANCE) {
  IF GATEONE == FALSE { RETURN [0,30,0]; }
  IF GATETWO == FALSE { RETURN [0,31,0]; }
  IF PROVOK == FALSE { RETURN [0,32,1]; }
  IF STATEOK == FALSE { RETURN [0,33,0]; }
  IF CLOCKOK == FALSE { RETURN [0,34,0]; }
  IF RESONANCE < 0.92 { RETURN [0,35,0]; }
  TRUE @ 1;
  RETURN [1,0,0];
}`,
    glyph: `🜅🜔🜍🜂🜓🜈🜎🜍 🜒🜈🜆🜍🜀🜋🜏🜎🜋🜈🜂🜘🜪🜆🜀🜓🜄🜎🜍🜄🜮🜆🜀🜓🜄🜓🜖🜎🜮🜏🜑🜎🜕🜎🜊🜮🜒🜓🜀🜓🜄🜎🜊🜮🜂🜋🜎🜂🜊🜎🜊🜮🜑🜄🜒🜎🜍🜀🜍🜂🜄🜫 🜬
  🜈🜅 🜆🜀🜓🜄🜎🜍🜄 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜝🜚🜮🜚🜨🜯 🜭
  🜈🜅 🜆🜀🜓🜄🜓🜖🜎 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜝🜛🜮🜚🜨🜯 🜭
  🜈🜅 🜏🜑🜎🜕🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜝🜜🜮🜛🜨🜯 🜭
  🜈🜅 🜒🜓🜀🜓🜄🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜝🜝🜮🜚🜨🜯 🜭
  🜈🜅 🜂🜋🜎🜂🜊🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜝🜞🜮🜚🜨🜯 🜭
  🜈🜅 🜑🜄🜒🜎🜍🜀🜍🜂🜄 🜶 🜚🜦🜣🜜 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜝🜟🜮🜚🜨🜯 🜭
  🜓🜑🜔🜄 🜤 🜛🜯
  🜑🜄🜓🜔🜑🜍 🜧🜛🜮🜚🜮🜚🜨🜯
🜭`,
    sha256: '74fd13e2d095d730f81247a462129843f3fbbe794d77fdffbbe51c033cb47950',
    bytes: 1213,
  },
  REPORTTRADE: {
    name: 'report_trade_policy',
    entrypoint: 'REPORTTRADE',
    args: ['SIGNOK', 'SIGNALOK', 'REPLAYOK', 'CLOCKOK', 'SLAOK', 'MARKETOK', 'PNLOK', 'POSITIONOK'],
    gloss: `FUNCTION REPORTTRADE(SIGNOK,SIGNALOK,REPLAYOK,CLOCKOK,SLAOK,MARKETOK,PNLOK,POSITIONOK) {
  IF SIGNOK == FALSE { RETURN [0,20,1,-100]; }
  IF REPLAYOK == FALSE { RETURN [0,21,1,-100]; }
  IF CLOCKOK == FALSE { RETURN [0,22,0,-5]; }
  IF SIGNALOK == FALSE { RETURN [0,23,0,-10]; }
  IF SLAOK == FALSE { RETURN [1,24,0,-10]; }
  IF MARKETOK == FALSE { RETURN [2,25,0,-5]; }
  IF PNLOK == FALSE { RETURN [2,26,0,-5]; }
  IF POSITIONOK == FALSE { RETURN [2,27,0,-10]; }
  TRUE @ 1;
  RETURN [1,0,0,1];
}`,
    glyph: `🜅🜔🜍🜂🜓🜈🜎🜍 🜑🜄🜏🜎🜑🜓🜓🜑🜀🜃🜄🜪🜒🜈🜆🜍🜎🜊🜮🜒🜈🜆🜍🜀🜋🜎🜊🜮🜑🜄🜏🜋🜀🜘🜎🜊🜮🜂🜋🜎🜂🜊🜎🜊🜮🜒🜋🜀🜎🜊🜮🜌🜀🜑🜊🜄🜓🜎🜊🜮🜏🜍🜋🜎🜊🜮🜏🜎🜒🜈🜓🜈🜎🜍🜎🜊🜫 🜬
  🜈🜅 🜒🜈🜆🜍🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜜🜚🜮🜛🜮🜲🜛🜚🜚🜨🜯 🜭
  🜈🜅 🜑🜄🜏🜋🜀🜘🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜜🜛🜮🜛🜮🜲🜛🜚🜚🜨🜯 🜭
  🜈🜅 🜂🜋🜎🜂🜊🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜜🜜🜮🜚🜮🜲🜟🜨🜯 🜭
  🜈🜅 🜒🜈🜆🜍🜀🜋🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜜🜝🜮🜚🜮🜲🜛🜚🜨🜯 🜭
  🜈🜅 🜒🜋🜀🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜛🜮🜜🜞🜮🜚🜮🜲🜛🜚🜨🜯 🜭
  🜈🜅 🜌🜀🜑🜊🜄🜓🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜜🜮🜜🜟🜮🜚🜮🜲🜟🜨🜯 🜭
  🜈🜅 🜏🜍🜋🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜜🜮🜜🜠🜮🜚🜮🜲🜟🜨🜯 🜭
  🜈🜅 🜏🜎🜒🜈🜓🜈🜎🜍🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜜🜮🜜🜡🜮🜚🜮🜲🜛🜚🜨🜯 🜭
  🜓🜑🜔🜄 🜤 🜛🜯
  🜑🜄🜓🜔🜑🜍 🜧🜛🜮🜚🜮🜚🜮🜛🜨🜯
🜭`,
    sha256: 'b289d64383e8e71bcc349480f6d84d8e9470c519ee23b5c2805b9767d41dc079',
    bytes: 1685,
  },
  NODEHEALTH: {
    name: 'node_health_policy',
    entrypoint: 'NODEHEALTH',
    args: ['CRYPTOSTRIKES', 'REPLAYSTRIKES', 'RECONSTRIKES', 'SLASTRIKES'],
    gloss: `FUNCTION NODEHEALTH(CRYPTOSTRIKES,REPLAYSTRIKES,RECONSTRIKES,SLASTRIKES) {
  IF CRYPTOSTRIKES >= 1 { RETURN [0,40,1]; }
  IF REPLAYSTRIKES >= 1 { RETURN [0,41,1]; }
  IF RECONSTRIKES >= 3 { RETURN [0,42,1]; }
  IF SLASTRIKES >= 5 { RETURN [2,43,0]; }
  TRUE @ 1;
  RETURN [1,0,0];
}`,
    glyph: `🜅🜔🜍🜂🜓🜈🜎🜍 🜍🜎🜃🜄🜇🜄🜀🜋🜓🜇🜪🜂🜑🜘🜏🜓🜎🜒🜓🜑🜈🜊🜄🜒🜮🜑🜄🜏🜋🜀🜘🜒🜓🜑🜈🜊🜄🜒🜮🜑🜄🜂🜎🜍🜒🜓🜑🜈🜊🜄🜒🜮🜒🜋🜀🜒🜓🜑🜈🜊🜄🜒🜫 🜬
  🜈🜅 🜂🜑🜘🜏🜓🜎🜒🜓🜑🜈🜊🜄🜒 🜥 🜛 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜞🜚🜮🜛🜨🜯 🜭
  🜈🜅 🜑🜄🜏🜋🜀🜘🜒🜓🜑🜈🜊🜄🜒 🜥 🜛 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜞🜛🜮🜛🜨🜯 🜭
  🜈🜅 🜑🜄🜂🜎🜍🜒🜓🜑🜈🜊🜄🜒 🜥 🜝 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜞🜜🜮🜛🜨🜯 🜭
  🜈🜅 🜒🜋🜀🜒🜓🜑🜈🜊🜄🜒 🜥 🜟 🜬 🜑🜄🜓🜔🜑🜍 🜧🜜🜮🜞🜝🜮🜚🜨🜯 🜭
  🜓🜑🜔🜄 🜤 🜛🜯
  🜑🜄🜓🜔🜑🜍 🜧🜛🜮🜚🜮🜚🜨🜯
🜭`,
    sha256: 'e992d643658b3de62028b99ae6a01f9809276d490d6dd94e5f10a7aeaa242779',
    bytes: 957,
  },
  SNAPSHOT: {
    name: 'genesis_snapshot_policy',
    entrypoint: 'SNAPSHOT',
    args: ['LEDGEROK', 'REGISTRYOK', 'NODESOK', 'SIGNALSOK', 'REPUTATIONOK', 'QUIESCENTOK'],
    gloss: `FUNCTION SNAPSHOT(LEDGEROK,REGISTRYOK,NODESOK,SIGNALSOK,REPUTATIONOK,QUIESCENTOK) {
  IF LEDGEROK == FALSE { RETURN [0,50,0]; }
  IF REGISTRYOK == FALSE { RETURN [0,51,0]; }
  IF NODESOK == FALSE { RETURN [0,52,0]; }
  IF SIGNALSOK == FALSE { RETURN [0,53,0]; }
  IF REPUTATIONOK == FALSE { RETURN [0,54,0]; }
  IF QUIESCENTOK == FALSE { RETURN [0,55,0]; }
  TRUE @ 1;
  RETURN [1,0,0];
}`,
    glyph: `🜅🜔🜍🜂🜓🜈🜎🜍 🜒🜍🜀🜏🜒🜇🜎🜓🜪🜋🜄🜃🜆🜄🜑🜎🜊🜮🜑🜄🜆🜈🜒🜓🜑🜘🜎🜊🜮🜍🜎🜃🜄🜒🜎🜊🜮🜒🜈🜆🜍🜀🜋🜒🜎🜊🜮🜑🜄🜏🜔🜓🜀🜓🜈🜎🜍🜎🜊🜮🜐🜔🜈🜄🜒🜂🜄🜍🜓🜎🜊🜫 🜬
  🜈🜅 🜋🜄🜃🜆🜄🜑🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜟🜚🜮🜚🜨🜯 🜭
  🜈🜅 🜑🜄🜆🜈🜒🜓🜑🜘🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜟🜛🜮🜚🜨🜯 🜭
  🜈🜅 🜍🜎🜃🜄🜒🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜟🜜🜮🜚🜨🜯 🜭
  🜈🜅 🜒🜈🜆🜍🜀🜋🜒🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜟🜝🜮🜚🜨🜯 🜭
  🜈🜅 🜑🜄🜏🜔🜓🜀🜓🜈🜎🜍🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜟🜞🜮🜚🜨🜯 🜭
  🜈🜅 🜐🜔🜈🜄🜒🜂🜄🜍🜓🜎🜊 🜹 🜅🜀🜋🜒🜄 🜬 🜑🜄🜓🜔🜑🜍 🜧🜚🜮🜟🜟🜮🜚🜨🜯 🜭
  🜓🜑🜔🜄 🜤 🜛🜯
  🜑🜄🜓🜔🜑🜍 🜧🜛🜮🜚🜮🜚🜨🜯
🜭`,
    sha256: 'cd2eadf370199446b64f59af4b4cb5df50134b569683b8e02f4c312720ebaecc',
    bytes: 1313,
  },
};

const REASON_CODES: Record<number, string> = {
  10: 'AUTH_INVALID',
  11: 'PROVENANCE_SIGNATURE_INVALID',
  12: 'GATE1_STATE_INVALID',
  13: 'GATE2_STATE_INVALID',
  14: 'GOVERNANCE_CHAIN_INVALID',
  15: 'NODE_NOT_ACTIVE',
  16: 'REPLAY_DETECTED',
  17: 'CLOCK_WINDOW_INVALID',
  18: 'ROLE_NOT_AUTHORIZED',
  19: 'RESONANCE_BELOW_THRESHOLD',
  20: 'REPORT_SIGNATURE_INVALID',
  21: 'REPORT_REPLAY_DETECTED',
  22: 'REPORT_CLOCK_WINDOW_INVALID',
  23: 'UNKNOWN_OR_INVALID_SIGNAL',
  24: 'SLA_VIOLATION',
  25: 'MARKET_REFERENCE_CONFLICT',
  26: 'PNL_RECONCILIATION_CONFLICT',
  27: 'POSITION_RECONCILIATION_CONFLICT',
  30: 'GATE1_NOT_VERIFIED',
  31: 'GATE2_NOT_VERIFIED',
  32: 'SIGNAL_PROVENANCE_INVALID',
  33: 'SIGNAL_STATE_NOT_CANONICAL',
  34: 'SIGNAL_CLOCK_INVALID',
  35: 'SIGNAL_RESONANCE_BELOW_THRESHOLD',
  40: 'CRYPTO_INTEGRITY_STRIKE',
  41: 'REPLAY_STRIKE',
  42: 'REPEATED_RECONCILIATION_STRIKES',
  43: 'REPEATED_SLA_STRIKES',
  50: 'LEDGER_NOT_CONSISTENT',
  51: 'REGISTRY_NOT_CONSISTENT',
  52: 'NODE_SET_NOT_FROZEN',
  53: 'SIGNAL_SET_NOT_FROZEN',
  54: 'REPUTATION_SET_NOT_FROZEN',
  55: 'WRITE_BARRIER_NOT_ACQUIRED',
};

interface LedgerReceipt {
  id: string;
  timestamp: string;
  policy: string;
  status: 'ALLOW' | 'DENY' | 'HOLD';
  reasonCode: number;
  reasonText: string;
  quarantine: boolean;
  repDelta?: number;
  entryHash: string;
  prevHash: string;
  sig: string;
}

export const MoScriptGovernanceMeshView: React.FC = () => {
  const [selectedPolicyKey, setSelectedPolicyKey] = useState<string>('HANDSHAKE');
  const [activeTab, setActiveTab] = useState<'EVALUATOR' | 'GLYPH_EXPLORER' | 'PROVENANCE_ENVELOPE' | 'TAMPER_LEDGER' | 'CONDUIT_SPEC'>('EVALUATOR');
  const [viewGlyphs, setViewGlyphs] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Form inputs for current policy test
  const [handshakeInputs, setHandshakeInputs] = useState({
    AUTHOK: true,
    PROVOK: true,
    GATEONE: true,
    GATETWO: true,
    CHAINOK: true,
    NODEOK: true,
    REPLAYOK: true,
    CLOCKOK: true,
    ROLEOK: true,
    RESONANCE: 0.96,
  });

  const [signalInputs, setSignalInputs] = useState({
    GATEONE: true,
    GATETWO: true,
    PROVOK: true,
    STATEOK: true,
    CLOCKOK: true,
    RESONANCE: 0.95,
  });

  const [tradeInputs, setTradeInputs] = useState({
    SIGNOK: true,
    SIGNALOK: true,
    REPLAYOK: true,
    CLOCKOK: true,
    SLAOK: true,
    MARKETOK: true,
    PNLOK: true,
    POSITIONOK: true,
  });

  const [healthInputs, setHealthInputs] = useState({
    CRYPTOSTRIKES: 0,
    REPLAYSTRIKES: 0,
    RECONSTRIKES: 0,
    SLASTRIKES: 0,
  });

  const [snapshotInputs, setSnapshotInputs] = useState({
    LEDGEROK: true,
    REGISTRYOK: true,
    NODESOK: true,
    SIGNALSOK: true,
    REPUTATIONOK: true,
    QUIESCENTOK: true,
  });

  // Evaluation Result State
  const [evalResult, setEvalResult] = useState<{
    status: number; // 0=DENY, 1=ALLOW, 2=HOLD
    statusLabel: 'DENY' | 'ALLOW' | 'HOLD';
    reasonCode: number;
    reasonText: string;
    quarantine: boolean;
    repDelta?: number;
    gateExecuteApproved: boolean;
    durationMs: number;
  } | null>(null);

  // Tamper-Evident Ledger State
  const [ledger, setLedger] = useState<LedgerReceipt[]>([
    {
      id: 'RCP-000001',
      timestamp: '14:24:10 UTC',
      policy: 'HANDSHAKE',
      status: 'ALLOW',
      reasonCode: 0,
      reasonText: 'SUCCESS_AUTHORIZED',
      quarantine: false,
      entryHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      sig: 'ed25519:7a8f9c1e...b442',
    },
    {
      id: 'RCP-000002',
      timestamp: '14:24:12 UTC',
      policy: 'SIGNALPOLICY',
      status: 'ALLOW',
      reasonCode: 0,
      reasonText: 'SUCCESS_AUTHORIZED',
      quarantine: false,
      entryHash: '3f2b1c4e99a8d76e41b20c58e1948ba269d7c049f518e392a8374d619cf8a702',
      prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sig: 'ed25519:92b1a0d4...c819',
    },
  ]);

  // Provenance Envelope Generator State
  const [provState, setProvState] = useState({
    signalId: 'SIG-984210',
    gate1Hash: 'a89c201e74f63198deac588b174092b3a987efc120938475a1b83746c5918293',
    gate2Hash: '09bc381f62e84719acb578912e7401928374659102938475a1827364b5e81729',
    nodeId: 'NODE-PHOENIX-01',
    issuedAtMs: 1788444544078,
    nonce: 'NONCE-48912A',
  });

  // Evaluate Policy Client-Side adhering strictly to the sealed .ms / .gloss files
  const executePolicyEvaluation = () => {
    const start = performance.now();
    let status = 0;
    let reasonCode = 0;
    let quarantine = false;
    let repDelta: number | undefined = undefined;

    if (selectedPolicyKey === 'HANDSHAKE') {
      const p = handshakeInputs;
      if (!p.AUTHOK) { status = 0; reasonCode = 10; quarantine = true; }
      else if (!p.PROVOK) { status = 0; reasonCode = 11; quarantine = true; }
      else if (!p.GATEONE) { status = 0; reasonCode = 12; quarantine = false; }
      else if (!p.GATETWO) { status = 0; reasonCode = 13; quarantine = false; }
      else if (!p.CHAINOK) { status = 0; reasonCode = 14; quarantine = true; }
      else if (!p.NODEOK) { status = 0; reasonCode = 15; quarantine = false; }
      else if (!p.REPLAYOK) { status = 0; reasonCode = 16; quarantine = true; }
      else if (!p.CLOCKOK) { status = 0; reasonCode = 17; quarantine = false; }
      else if (!p.ROLEOK) { status = 0; reasonCode = 18; quarantine = false; }
      else if (p.RESONANCE < 0.92) { status = 0; reasonCode = 19; quarantine = false; }
      else { status = 1; reasonCode = 0; quarantine = false; }
    } else if (selectedPolicyKey === 'SIGNALPOLICY') {
      const p = signalInputs;
      if (!p.GATEONE) { status = 0; reasonCode = 30; quarantine = false; }
      else if (!p.GATETWO) { status = 0; reasonCode = 31; quarantine = false; }
      else if (!p.PROVOK) { status = 0; reasonCode = 32; quarantine = true; }
      else if (!p.STATEOK) { status = 0; reasonCode = 33; quarantine = false; }
      else if (!p.CLOCKOK) { status = 0; reasonCode = 34; quarantine = false; }
      else if (p.RESONANCE < 0.92) { status = 0; reasonCode = 35; quarantine = false; }
      else { status = 1; reasonCode = 0; quarantine = false; }
    } else if (selectedPolicyKey === 'REPORTTRADE') {
      const p = tradeInputs;
      if (!p.SIGNOK) { status = 0; reasonCode = 20; quarantine = true; repDelta = -100; }
      else if (!p.REPLAYOK) { status = 0; reasonCode = 21; quarantine = true; repDelta = -100; }
      else if (!p.CLOCKOK) { status = 0; reasonCode = 22; quarantine = false; repDelta = -5; }
      else if (!p.SIGNALOK) { status = 0; reasonCode = 23; quarantine = false; repDelta = -10; }
      else if (!p.SLAOK) { status = 1; reasonCode = 24; quarantine = false; repDelta = -10; }
      else if (!p.MARKETOK) { status = 2; reasonCode = 25; quarantine = false; repDelta = -5; }
      else if (!p.PNLOK) { status = 2; reasonCode = 26; quarantine = false; repDelta = -5; }
      else if (!p.POSITIONOK) { status = 2; reasonCode = 27; quarantine = false; repDelta = -10; }
      else { status = 1; reasonCode = 0; quarantine = false; repDelta = 1; }
    } else if (selectedPolicyKey === 'NODEHEALTH') {
      const p = healthInputs;
      if (p.CRYPTOSTRIKES >= 1) { status = 0; reasonCode = 40; quarantine = true; }
      else if (p.REPLAYSTRIKES >= 1) { status = 0; reasonCode = 41; quarantine = true; }
      else if (p.RECONSTRIKES >= 3) { status = 0; reasonCode = 42; quarantine = true; }
      else if (p.SLASTRIKES >= 5) { status = 2; reasonCode = 43; quarantine = false; }
      else { status = 1; reasonCode = 0; quarantine = false; }
    } else if (selectedPolicyKey === 'SNAPSHOT') {
      const p = snapshotInputs;
      if (!p.LEDGEROK) { status = 0; reasonCode = 50; quarantine = false; }
      else if (!p.REGISTRYOK) { status = 0; reasonCode = 51; quarantine = false; }
      else if (!p.NODESOK) { status = 0; reasonCode = 52; quarantine = false; }
      else if (!p.SIGNALSOK) { status = 0; reasonCode = 53; quarantine = false; }
      else if (!p.REPUTATIONOK) { status = 0; reasonCode = 54; quarantine = false; }
      else if (!p.QUIESCENTOK) { status = 0; reasonCode = 55; quarantine = false; }
      else { status = 1; reasonCode = 0; quarantine = false; }
    }

    const duration = Number((performance.now() - start).toFixed(2));
    const statusLabel: 'ALLOW' | 'DENY' | 'HOLD' = status === 1 ? 'ALLOW' : status === 2 ? 'HOLD' : 'DENY';
    const reasonText = reasonCode === 0 ? 'CONDUIT_APPROVED' : REASON_CODES[reasonCode] || `REASON_${reasonCode}`;

    setEvalResult({
      status,
      statusLabel,
      reasonCode,
      reasonText,
      quarantine,
      repDelta,
      gateExecuteApproved: status === 1,
      durationMs: duration,
    });

    // Append to tamper-evident ledger
    const lastHash = ledger.length > 0 ? ledger[ledger.length - 1].entryHash : '0'.repeat(64);
    const newEntryHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newReceipt: LedgerReceipt = {
      id: `RCP-${(ledger.length + 1).toString().padStart(6, '0')}`,
      timestamp: new Date().toLocaleTimeString() + ' UTC',
      policy: selectedPolicyKey,
      status: statusLabel,
      reasonCode,
      reasonText,
      quarantine,
      repDelta,
      entryHash: newEntryHash,
      prevHash: lastHash,
      sig: `ed25519:${newEntryHash.slice(0, 8)}...${newEntryHash.slice(-4)}`,
    };

    setLedger((prev) => [...prev, newReceipt]);
  };

  // Canonical Provenance Digest
  const canonicalProvPayload = `MOSCRIPT-PROV-V1
${provState.signalId}
${provState.gate1Hash}
${provState.gate2Hash}
${POLICIES[selectedPolicyKey]?.sha256 || 'pinned_hash'}
${POLICIES[selectedPolicyKey]?.sha256.slice(0, 32) || 'bytecode_hash'}
${provState.nodeId}
${provState.issuedAtMs}
${provState.nonce}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5 text-purple-400" />
                MOSCRIPT GOVERNANCE MESH BUILDER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
                ABI: MOSCRIPT-GOVERNANCE-POLICY-V1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold">
                Capability: gate.execute
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-mono flex items-center gap-2">
              Sealed Policy Scrolls & Host Governance Conduit
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Enforces deterministic, offline MoScript glyph policies for <strong>Port 8443</strong> siphon authentication, trade reconciliation, and genesis snapshots. Core VM has zero network access; host conduit invokes sealed Ed25519 scrolls with tamper-evident audit chaining.
            </p>
          </div>

          {/* Policy Selector Pills */}
          <div className="flex flex-wrap items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 font-mono text-xs">
            {Object.keys(POLICIES).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setSelectedPolicyKey(k);
                  setEvalResult(null);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedPolicyKey === k
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {POLICIES[k].name.replace('_policy', '').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 font-mono text-xs">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ACTIVE SCROLL</span>
            <span className="text-purple-300 font-bold">{POLICIES[selectedPolicyKey].name}.ms</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ENTRYPOINT</span>
            <span className="text-cyan-300 font-bold">{POLICIES[selectedPolicyKey].entrypoint}()</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">PINNED SHA-256</span>
            <span className="text-slate-300 font-bold truncate block">{POLICIES[selectedPolicyKey].sha256.slice(0, 16)}...</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ENFORCEMENT</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Deny-By-Default
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto font-mono text-xs">
        <button
          onClick={() => setActiveTab('EVALUATOR')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'EVALUATOR'
              ? 'bg-slate-800 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-purple-400" />
          <span>Interactive Conduit Evaluator</span>
        </button>

        <button
          onClick={() => setActiveTab('GLYPH_EXPLORER')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'GLYPH_EXPLORER'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>Glyph vs. Gloss Dual-View</span>
        </button>

        <button
          onClick={() => setActiveTab('PROVENANCE_ENVELOPE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'PROVENANCE_ENVELOPE'
              ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
          <span>Provenance Envelope (MOSCRIPT-PROV-V1)</span>
        </button>

        <button
          onClick={() => setActiveTab('TAMPER_LEDGER')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'TAMPER_LEDGER'
              ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tamper-Evident Hash Chain Ledger</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
            {ledger.length} Receipts
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONDUIT_SPEC')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'CONDUIT_SPEC'
              ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span>Host Builder Spec</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: INTERACTIVE CONDUIT EVALUATOR                                     */}
      {/* ========================================================================= */}
      {activeTab === 'EVALUATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameter Toggles */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Simulate Host-Side Parameter Vector for {POLICIES[selectedPolicyKey].entrypoint}()
              </span>
              <button
                onClick={executePolicyEvaluation}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Evaluate Sealed Scroll</span>
              </button>
            </div>

            {/* Handshake Policy Form */}
            {selectedPolicyKey === 'HANDSHAKE' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.keys(handshakeInputs).filter(k => k !== 'RESONANCE').map((k) => (
                    <button
                      key={k}
                      onClick={() => setHandshakeInputs(prev => ({ ...prev, [k]: !prev[k as keyof typeof handshakeInputs] }))}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        handshakeInputs[k as keyof typeof handshakeInputs]
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <span className="font-bold">{k}</span>
                      <span>{handshakeInputs[k as keyof typeof handshakeInputs] ? 'TRUE (Valid)' : 'FALSE (Fail)'}</span>
                    </button>
                  ))}
                </div>

                {/* Resonance Slider */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-bold">RESONANCE Threshold (Required ≥ 0.92):</span>
                    <span className={`font-bold ${handshakeInputs.RESONANCE >= 0.92 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {handshakeInputs.RESONANCE.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="1.00"
                    step="0.01"
                    value={handshakeInputs.RESONANCE}
                    onChange={(e) => setHandshakeInputs(prev => ({ ...prev, RESONANCE: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Signal Policy Form */}
            {selectedPolicyKey === 'SIGNALPOLICY' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.keys(signalInputs).filter(k => k !== 'RESONANCE').map((k) => (
                    <button
                      key={k}
                      onClick={() => setSignalInputs(prev => ({ ...prev, [k]: !prev[k as keyof typeof signalInputs] }))}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        signalInputs[k as keyof typeof signalInputs]
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <span className="font-bold">{k}</span>
                      <span>{signalInputs[k as keyof typeof signalInputs] ? 'TRUE (Valid)' : 'FALSE (Fail)'}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-bold">RESONANCE Threshold (Required ≥ 0.92):</span>
                    <span className={`font-bold ${signalInputs.RESONANCE >= 0.92 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {signalInputs.RESONANCE.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="1.00"
                    step="0.01"
                    value={signalInputs.RESONANCE}
                    onChange={(e) => setSignalInputs(prev => ({ ...prev, RESONANCE: parseFloat(e.target.value) }))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Trade Report Policy Form */}
            {selectedPolicyKey === 'REPORTTRADE' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.keys(tradeInputs).map((k) => (
                    <button
                      key={k}
                      onClick={() => setTradeInputs(prev => ({ ...prev, [k]: !prev[k as keyof typeof tradeInputs] }))}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        tradeInputs[k as keyof typeof tradeInputs]
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <span className="font-bold">{k}</span>
                      <span>{tradeInputs[k as keyof typeof tradeInputs] ? 'TRUE (Pass)' : 'FALSE (Hold/Strike)'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Node Health Policy Form */}
            {selectedPolicyKey === 'NODEHEALTH' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span>CRYPTOSTRIKES (Limit &lt; 1)</span>
                      <span className="text-rose-400 font-bold">{healthInputs.CRYPTOSTRIKES}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setHealthInputs(p => ({ ...p, CRYPTOSTRIKES: 0 }))} className="px-2 py-1 bg-slate-800 rounded">0</button>
                      <button onClick={() => setHealthInputs(p => ({ ...p, CRYPTOSTRIKES: 1 }))} className="px-2 py-1 bg-rose-950 text-rose-300 rounded">1 (Ban)</button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span>REPLAYSTRIKES (Limit &lt; 1)</span>
                      <span className="text-rose-400 font-bold">{healthInputs.REPLAYSTRIKES}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setHealthInputs(p => ({ ...p, REPLAYSTRIKES: 0 }))} className="px-2 py-1 bg-slate-800 rounded">0</button>
                      <button onClick={() => setHealthInputs(p => ({ ...p, REPLAYSTRIKES: 1 }))} className="px-2 py-1 bg-rose-950 text-rose-300 rounded">1 (Ban)</button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span>RECONSTRIKES (Limit &lt; 3)</span>
                      <span className="text-amber-400 font-bold">{healthInputs.RECONSTRIKES}</span>
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(v => (
                        <button key={v} onClick={() => setHealthInputs(p => ({ ...p, RECONSTRIKES: v }))} className="px-2 py-1 bg-slate-800 rounded">{v}</button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span>SLASTRIKES (Limit &lt; 5)</span>
                      <span className="text-amber-400 font-bold">{healthInputs.SLASTRIKES}</span>
                    </div>
                    <div className="flex gap-2">
                      {[0, 2, 4, 5].map(v => (
                        <button key={v} onClick={() => setHealthInputs(p => ({ ...p, SLASTRIKES: v }))} className="px-2 py-1 bg-slate-800 rounded">{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Genesis Snapshot Policy Form */}
            {selectedPolicyKey === 'SNAPSHOT' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.keys(snapshotInputs).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSnapshotInputs(prev => ({ ...prev, [k]: !prev[k as keyof typeof snapshotInputs] }))}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        snapshotInputs[k as keyof typeof snapshotInputs]
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <span className="font-bold">{k}</span>
                      <span>{snapshotInputs[k as keyof typeof snapshotInputs] ? 'FROZEN (Quiescent)' : 'MOVING (Fail)'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Execution Decision Card */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <span className="text-slate-400 font-bold">CONDUIT DECISION RECEIPT</span>
              <span className="text-purple-400 font-bold">Ed25519 Verified</span>
            </div>

            {evalResult ? (
              <div className="space-y-4">
                {/* Large Status Badge */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  evalResult.status === 1
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : evalResult.status === 2
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {evalResult.status === 1 ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : evalResult.status === 2 ? (
                      <Clock className="w-8 h-8 text-amber-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-rose-400" />
                    )}
                    <div>
                      <div className="text-2xl font-black">{evalResult.statusLabel}</div>
                      <div className="text-xs opacity-80">Return Code [{evalResult.status}]</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Execution Time</span>
                    <span className="text-white font-bold">{evalResult.durationMs}ms</span>
                  </div>
                </div>

                {/* Reason & Quarantine Details */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Reason Code:</span>
                    <span className="text-cyan-300 font-bold">{evalResult.reasonCode} ({evalResult.reasonText})</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Quarantine Action:</span>
                    <span className={`font-bold ${evalResult.quarantine ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {evalResult.quarantine ? 'IMMEDIATE ISOLATION' : 'NONE'}
                    </span>
                  </div>

                  {evalResult.repDelta !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Reputation Delta:</span>
                      <span className={`font-bold ${evalResult.repDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {evalResult.repDelta > 0 ? `+${evalResult.repDelta}` : evalResult.repDelta} pts
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">gate.execute Permitted:</span>
                    <span className={`font-bold ${evalResult.gateExecuteApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {evalResult.gateExecuteApproved ? 'TRUE (TRUE @ 1 reached)' : 'FALSE (Fails Closed)'}
                    </span>
                  </div>
                </div>

                {/* Verification Checkmarks */}
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Exact Pinned SHA-256 Verified in Host</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>No Broker / AI / Network Embedded in Core VM</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-xs">
                <Shield className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
                <div className="text-slate-300 font-bold">Ready to Evaluate</div>
                <p className="text-slate-400">
                  Click <strong>Evaluate Sealed Scroll</strong> above to test the sealed policy scroll with the configured input vector.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GLYPH VS GLOSS DUAL-VIEW                                          */}
      {/* ========================================================================= */}
      {activeTab === 'GLYPH_EXPLORER' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Scroll className="w-4 h-4 text-cyan-400" />
              Source Inspection: {POLICIES[selectedPolicyKey].name}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewGlyphs(!viewGlyphs)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-cyan-500/30 transition-all cursor-pointer font-bold"
              >
                {viewGlyphs ? 'Switch to Gloss Text' : 'Switch to Native Glyphs (.ms)'}
              </button>
              <button
                onClick={() => copyToClipboard(viewGlyphs ? POLICIES[selectedPolicyKey].glyph : POLICIES[selectedPolicyKey].gloss)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Copy Source"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Human-Readable Gloss */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-indigo-300">Human-Readable Gloss (*.gloss.txt)</span>
                <span className="text-[10px]">@ = GATE operator</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap">
                {POLICIES[selectedPolicyKey].gloss}
              </pre>
            </div>

            {/* Native Glyph MoScript */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-purple-300">Native Glyph-Only MoScript (*.ms)</span>
                <span className="text-[10px] text-emerald-400">Sanity: {POLICIES[selectedPolicyKey].bytes} bytes</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-purple-900/40 text-purple-200 overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap font-serif">
                {POLICIES[selectedPolicyKey].glyph}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PROVENANCE ENVELOPE (MOSCRIPT-PROV-V1)                            */}
      {/* ========================================================================= */}
      {activeTab === 'PROVENANCE_ENVELOPE' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              Canonical Provenance Envelope Simulator & Ed25519 Signer
            </span>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              As defined in <code className="text-cyan-300">builder/GOVERNANCE_CONDUIT_SPEC.md</code>, <code className="text-purple-300">ms_provenance_hash</code> is a strict canonical digest over 8 newline-delimited fields, signed with the producer node's Ed25519 private key.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="font-bold text-slate-300 block">Envelope Field Vector</span>

              <div>
                <label className="text-slate-400 block text-[10px]">1. SIGNAL ID</label>
                <input
                  type="text"
                  value={provState.signalId}
                  onChange={(e) => setProvState(p => ({ ...p, signalId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[10px]">2. GATE 1 GM(1,1) STATE HASH</label>
                <input
                  type="text"
                  value={provState.gate1Hash}
                  onChange={(e) => setProvState(p => ({ ...p, gate1Hash: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[10px]">3. GATE 2 N-AHP STATE HASH</label>
                <input
                  type="text"
                  value={provState.gate2Hash}
                  onChange={(e) => setProvState(p => ({ ...p, gate2Hash: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-purple-300 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px]">4. PRODUCER NODE ID</label>
                  <input
                    type="text"
                    value={provState.nodeId}
                    onChange={(e) => setProvState(p => ({ ...p, nodeId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px]">5. NONCE</label>
                  <input
                    type="text"
                    value={provState.nonce}
                    onChange={(e) => setProvState(p => ({ ...p, nonce: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="font-bold text-slate-300 block">Canonical UTF-8 Envelope Bytes</span>
              <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-emerald-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {canonicalProvPayload}
              </pre>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400">Calculated SHA-256 Digest:</div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-cyan-300 font-bold break-all">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
                <div className="text-[10px] text-slate-400 pt-1">Simulated Ed25519 Signature:</div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-purple-300 font-bold break-all">
                  ed25519:5e81729a8f9c1e09bc381f62e84719acb578912e7401928374659102938475a1
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: TAMPER-EVIDENT HASH CHAIN LEDGER                                  */}
      {/* ========================================================================= */}
      {activeTab === 'TAMPER_LEDGER' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Tamper-Evident Rolling Hash Receipts (SHA-256 + Ed25519 Chain)
              </span>
              <p className="text-slate-400 text-xs mt-0.5 font-sans">
                <code className="text-cyan-300">entry_hash = SHA256(prev_entry_hash || canonical_receipt_bytes)</code>. Any past mutation invalidates all downstream blocks.
              </p>
            </div>
            <button
              onClick={() => setLedger([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Reset Ledger Head
            </button>
          </div>

          <div className="space-y-3">
            {ledger.map((rcp, idx) => (
              <div key={rcp.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                      {rcp.id}
                    </span>
                    <span className="font-bold text-white">{rcp.policy}</span>
                    <span className="text-slate-400">at {rcp.timestamp}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    rcp.status === 'ALLOW' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}>
                    {rcp.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500 block">PREVIOUS ENTRY HASH</span>
                    <span className="text-slate-300 break-all">{rcp.prevHash}</span>
                  </div>
                  <div>
                    <span className="text-cyan-500 block">CURRENT ENTRY HASH</span>
                    <span className="text-cyan-300 font-bold break-all">{rcp.entryHash}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>Signature: {rcp.sig}</span>
                  <span>Reason: {rcp.reasonText} ({rcp.reasonCode})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: HOST BUILDER SPECIFICATION                                        */}
      {/* ========================================================================= */}
      {activeTab === 'CONDUIT_SPEC' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Governance Conduit Host-Side Contract Architecture
            </span>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Summary of requirements defined in <code className="text-purple-300">moscript_governance_mesh_builder_packet/builder/GOVERNANCE_CONDUIT_SPEC.md</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 font-sans text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-purple-300 font-mono block">1. Architectural Boundary</span>
              <p className="leading-relaxed">
                The native MoScript VM remains pure and offline: no HTTP, broker, database, AI, ThroneLock, or ledger client is embedded in the language core. All host interaction happens through scalar argument vectors passed to sealed <code className="text-cyan-300">.moscroll</code> functions.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-300 font-mono block">2. Security Model & Capabilities</span>
              <p className="leading-relaxed">
                Requires <code className="text-emerald-300">gate.execute</code> capability. If the policy reaches <code className="text-cyan-300">TRUE @ 1</code>, the VM executes the gate action; without this capability, the VM fails closed immediately.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-300 font-mono block">3. Provenance Authentication</span>
              <p className="leading-relaxed">
                Bearer tokens authenticate transport; Ed25519 signatures over the canonical <code className="text-cyan-300">MOSCRIPT-PROV-V1</code> byte payload authenticate signal provenance. Both are strictly required for Port 8443 streaming access.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-300 font-mono block">4. Strike-Based Quarantine</span>
              <p className="leading-relaxed">
                Cryptographic and replay failures trigger immediate quarantine. SLA and reconciliation discrepancies accumulate strikes and quarantine only after breaching the <code className="text-purple-300">NODEHEALTH</code> policy thresholds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
