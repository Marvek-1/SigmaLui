# Governance Conduit — Builder Contract

## Architectural boundary

The native MoScript VM remains pure and offline: no HTTP, broker, database, AI, ThroneLock, or ledger client is embedded in the language core.

Builder adds a host-side `GovernanceConduit` that:
1. authenticates the caller,
2. validates timestamps/nonces,
3. verifies provenance and report signatures,
4. loads the pinned sealed `.moscroll`,
5. invokes one named policy function with typed scalar arguments,
6. requires `gate.execute`,
7. enforces the returned decision,
8. appends a tamper-evident receipt.

Do not generate or mutate MoScript source per request. Policy source is reviewed, compiled, sealed, pinned, and then invoked with host-supplied arguments.

## Required runtime extension

The v0.1.1 CLI executes `<main>` but does not expose dynamic arguments to a sealed top-level function. Add an embedding API around the existing VM; do not add networking to the VM.

Suggested interface:

```go
type PolicyInvocation struct {
    ScrollPath string
    EntryPoint string
    Args       []any
    AllowCaps  []string
    MaxSteps   int
}

type PolicyResult struct {
    Values        []any
    ProgramHash   string
    BytecodeHash  string
    PublicKey     string
}

func InvokeSealedPolicy(ctx context.Context, inv PolicyInvocation) (PolicyResult, error)
```

Rules:
- verify `.moscroll` signature against a trusted public key before invocation;
- require exact pinned program hash and ABI hash;
- resolve only a top-level function by exact name;
- reject argument count/type mismatches;
- cap steps, output, stack depth, and collection size;
- pass only explicitly allowed capabilities;
- never expose private keys or bearer credentials to the VM.

## Provenance envelope

`ms_provenance_hash` is a digest, not an authentication proof.

Canonical bytes:

```text
MOSCRIPT-PROV-V1\n
<signal_id>\n
<gate1_state_hash>\n
<gate2_state_hash>\n
<policy_program_hash>\n
<policy_bytecode_hash>\n
<producer_node_id>\n
<issued_at_unix_ms>\n
<nonce>
```

Compute SHA-256 over those exact UTF-8 bytes.

Then compute:
`ms_provenance_sig = Ed25519.sign(node_private_key, raw_sha256_digest)`

Verify with the node public key stored in the trusted registry.

Never treat `X-MoScripts-Provenance: ACTIVE` by itself as proof.

## Privileged stream request

Recommended headers:

```text
Authorization: Bearer <secret-manager-injected-token>
X-MoScript-Node-Id: <node-id>
X-MoScript-Program-Hash: <pinned-program-hash>
X-MoScript-Provenance-Hash: <sha256-hex>
X-MoScript-Provenance-Signature: <base64-ed25519-signature>
X-MoScript-Timestamp: <unix-ms>
X-MoScript-Nonce: <single-use-random-value>
X-Governance-Chain: MAINNET-TRUST
```

The bearer token is transport authentication. The Ed25519 signature is provenance authentication. Both are required for privileged access.

## Handshake resolution

Before invoking `HANDSHAKE`, the host computes:
- `AUTHOK`: bearer/mTLS/session auth succeeded.
- `PROVOK`: provenance signature and pinned program hash verified.
- `GATEONE`: GM(1,1) state is canonical and its hash matches the signal envelope.
- `GATETWO`: N-AHP state is canonical and its hash matches the signal envelope.
- `CHAINOK`: governance chain is allowlisted.
- `NODEOK`: node is registered, active, not quarantined, and key is current.
- `REPLAYOK`: nonce has not been used.
- `CLOCKOK`: timestamp is inside the allowed skew window.
- `ROLEOK`: node role is authorized for stream/report operation.
- `RESONANCE`: canonical resonance score from the trusted engine.

If the policy reaches `TRUE @ 1`, the VM must have `gate.execute` enabled or it fails closed.

## Report reconciliation

Before invoking `REPORTTRADE`, the host computes:
- `SIGNOK`: report signature verified.
- `SIGNALOK`: signal exists and provenance is valid.
- `REPLAYOK`: report id/nonce has not been used.
- `CLOCKOK`: report timestamp is in policy window.
- `SLAOK`: execution/report timing is within SLA.
- `MARKETOK`: referenced market snapshot/feed is valid and not stale.
- `PNLOK`: PnL reconciles within configured fees/slippage/tick tolerance.
- `POSITIONOK`: fill quantity, side, and position transition reconcile.

Policy status 2 means HOLD, not bad-faith attribution.

Immediate quarantine is reserved for cryptographic integrity/replay failures. Reconciliation disagreements accumulate strikes and quarantine only after the `NODEHEALTH` threshold.

## Tamper-evident ledger

For each receipt:

```text
entry_hash = SHA256(prev_entry_hash || canonical_receipt_bytes)
entry_sig  = Ed25519.sign(ledger_signing_key, entry_hash)
```

Persist:
- receipt id
- event type
- node id
- signal id/report id
- policy entrypoint
- policy program hash
- bytecode hash
- decision/status/reason
- input evidence hashes (not secrets)
- timestamp
- nonce
- previous entry hash
- entry hash
- signature

Database append-only controls are still required. A hash chain makes mutation detectable; it does not by itself make the system decentralized.

## Genesis snapshot

Acquire a write barrier or equivalent quiescent cut before snapshotting:
1. freeze node set,
2. freeze active signals,
3. freeze reputation state,
4. verify registry and ledger heads,
5. invoke `SNAPSHOT`,
6. canonicalize snapshot manifest,
7. hash + sign it,
8. append `GENESIS_SNAPSHOT` receipt,
9. release barrier.

Do not snapshot a moving set without recording the cut/sequence number.
