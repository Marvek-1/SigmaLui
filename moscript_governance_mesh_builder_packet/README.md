# MoScript Governance Mesh Builder Packet

This packet converts the proposed Port 8443 governance design into native MoScript policy scrolls plus a host-side builder contract.

## What is confirmed from the runtime

- native glyph-only MoScript source
- deterministic program identity
- sealed `.moscroll` artifacts with Ed25519 verification
- deny-by-default capabilities
- `gate.execute` capability
- no network/broker/AI inside the VM

## What this packet proposes

- a host-side `GovernanceConduit`
- dynamic invocation of named functions in a verified sealed scroll
- provenance envelope/signature format
- replay protection
- report reconciliation
- strike-based quarantine
- tamper-evident ledger receipts
- genesis snapshot protocol

These are implementation targets, not claims that Port 8443, latency, PnL, or the ledger are already operational.

## Files

Each policy has:
- `*.gloss.txt` — human-readable source using `@` as the GATE operator
- `*.ms` — native glyph-only MoScript source

Policies:
- `handshake_policy`
- `signal_policy`
- `report_trade_policy`
- `node_health_policy`
- `genesis_snapshot_policy`

## Return conventions

Status:
- `0` = DENY
- `1` = ALLOW / ACCEPT
- `2` = HOLD / REVIEW

The second element is a reason code. Some policies include quarantine and reputation-delta fields.

See `manifest.json`.

## Build / seal flow

Run with the trusted MoScript v0.1.1 toolchain:

```text
moscript check policies/handshake_policy.ms
moscript compile -o handshake_policy.mobc policies/handshake_policy.ms
moscript seal --key <secure-private-key-path> -o handshake_policy.moscroll policies/handshake_policy.ms
moscript verify --pub <trusted-public-key-path> handshake_policy.moscroll
```

Repeat for each policy.

Private keys must be generated and stored outside the source tree (HSM/KMS/secret manager where available). Do not commit them.

## Rollout

1. Stage policies and conduit with all operations disabled.
2. Verify scroll signatures, hashes, ABI, reason-code mappings, replay cache, and audit receipts.
3. Run contract tests with allow/deny/hold vectors.
4. Shadow-evaluate live traffic without enforcing decisions.
5. Enable handshake enforcement.
6. Enable report HOLD paths.
7. Enable quarantine only after strike logic and operator override/appeal are validated.
8. Create genesis snapshot only after ledger/registry consistency checks pass.

Rollback: disable the conduit feature flag and fall back to the previous authentication path while retaining receipts; never silently rewrite the ledger.
