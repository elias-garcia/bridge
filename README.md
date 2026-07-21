# Bridge

A minimal ERC-20 token bridge between **Base Sepolia** and **Linea Sepolia**, built as a take-home challenge under tight time constraints.

Users deposit tokens on one chain and receive them on the other. The bridge follows a **Lock & Mint** pattern inspired by the [xERC20 standard (ERC-7281)](https://ethereum-magicians.org/t/erc-7281-sovereign-bridged-tokens/14979): canonical tokens are escrowed on the source chain, and wrapped representations are minted on the destination. The bridge is bidirectional — when bridging back, wrapped tokens are burned and the originals are released.

## Architecture

```
User (UI)
  │
  │ deposit()
  ▼
Bridge (Source)
  │
  │ Deposited event
  ▼
Indexer (Ponder)
  │
  │ Pending deposits (GraphQL)
  ▼
Relayer
  │
  │ EIP-712 signed claim()
  ▼
Bridge (Dest) ──▶ mint/release tokens to recipient
```

| Component | Tech | Description |
|-----------|------|-------------|
| **Contracts** | Solidity, Foundry | Symmetric bridge contract, ERC-20 token + wrapped token |
| **Indexer** | [Ponder](https://ponder.sh) | Indexes `Deposited` and `Claimed` events from both chains, exposes a GraphQL API |
| **Relayer** | Node.js, TypeScript, viem | Polls the indexer for pending deposits, signs EIP-712 attestations, submits `claim()` transactions |
| **UI** | React, TypeScript, viem, Chakra UI | Bridge form with approve + deposit in one flow, transaction history with auto-refresh |

## Chains and deployed contracts

| Contract | Base Sepolia | Linea Sepolia |
|----------|-------------|---------------|
| Bridge | `0x8B345b1261D017c020C11C5E50B3c66865c4aF97` | `0x8B345b1261D017c020C11C5E50B3c66865c4aF97` |
| Token (ARKV) | `0xA668a7997b0F000D2D4765C233413Fac05c3307e` | `0xA668a7997b0F000D2D4765C233413Fac05c3307e` |

**Why these chains?** Both are L2 testnets with reliable public RPCs and fast finality. They are different enough (OP Stack vs zkEVM) to prove the bridge works across heterogeneous L2s.

## Running locally

Contracts are already deployed on both testnets — the addresses are hardcoded in the UI and available in `.env.example` files. You only need to run the indexer, relayer, and UI.

### Prerequisites

- Node.js >= 22
- Foundry (`forge`, `cast`) — only needed for running tests
- An RPC URL for each chain (public endpoints work fine)

### 1. Indexer

```bash
cd indexer
cp .env.example .env   # fill in RPC URLs and deployed contract addresses
npm install
npm run dev             # starts on http://localhost:42069
```

### 2. Relayer

```bash
cd relayer
cp .env.example .env   # fill in RPC URLs, bridge addresses, and attestor private key
npm install
npm run dev
```

### 3. UI

```bash
cd ui
cp .env.example .env   # defaults should work if indexer runs on :42069
npm install
npm run dev             # starts on http://localhost:5173
```

### Running tests

```bash
cd contracts
forge test
```

## How it works

1. **Deposit**: User approves the bridge and calls `deposit(token, amount, recipient)`. Tokens are locked (canonical) or burned (wrapped) and a `Deposited` event is emitted.
2. **Index**: Ponder picks up the event and stores it.
3. **Relay**: The relayer polls for unclaimed deposits, signs an EIP-712 `BridgeMessage`, and submits `claim()` on the destination.
4. **Claim**: The destination bridge verifies the attestor signature and replay protection (`keccak256(srcChainId, dstChainId, srcToken, recipient, amount, nonce)`), then releases or mints tokens.

### Token modes

The same contract is deployed on both chains, configured differently per token:

- **Base Sepolia (LOCK)**: canonical ARKV is escrowed on deposit, released on claim.
- **Linea Sepolia (MINT)**: `WrappedToken` is burned on deposit, minted on claim. The bridge holds the `MINTER_ROLE`.

## Tradeoffs and what I'd improve

Given the time constraints, several deliberate cuts were made. Below is what was cut, why, and what I'd do with more time.

### Security

The bridge relies on a **single trusted attestor** (the relayer's private key). If compromised, an attacker can mint unlimited wrapped tokens. There are no rate limits or deposit caps.

With more time:

- **Multi-sig attestation**: require N-of-M attestor signatures before a claim is accepted.
- **Optimistic verification**: introduce a challenge period before claim finalization.
- **Rate limiting**: per-token and per-time-window caps on the bridge contract (as in xERC20).
- **Real-time monitoring**: use a service like [Hypernative](https://hypernative.io) to enforce the core invariant (total locked on source = total minted on destination) and alert on anomalous patterns.

### Smart contracts

- **EIP-2612 Permit** is partially built (both tokens extend `ERC20Permit`) but not wired into the bridge. A `depositWithPermit()` would allow approve + deposit in a single user transaction.
- Foundry tests cover deposit, claim (both modes), and key reverts (replay, bad signature, wrong chain, unsupported token). Missing: fuzz testing and invariant testing (e.g., "total locked = total minted").

### Relayer

The relayer is deliberately kept simple — a stateless polling loop with no persistence:

- **No finality wait**: the relayer claims as soon as the deposit appears in the indexer, without waiting for a confirmation threshold. If a deposit were reorged out after claiming, the destination would have unbacked minted tokens.
- **No claim status tracking**: relies on the on-chain `processed` mapping and the indexer's `claims` table instead of its own state. Simpler, but may re-attempt in-flight claims after a restart.
- **No retry logic**: failed claims are retried on the next poll cycle with no backoff or dead-letter queue.
- **No nonce management**: uses viem's defaults. Under high throughput, sequential submissions could bottleneck.

### Infrastructure

- The indexer uses **PGlite** (in-process) instead of PostgreSQL. Data doesn't persist across restarts and can't be shared with the relayer. With a shared Postgres, the relayer could write claim tx hashes to the DB so the UI can link to block explorers.

### UI and UX

- **No error feedback**: wallet rejections and reverts are only logged to the console.
- **No optimistic updates**: history polls every 5s rather than immediately showing the pending deposit.
- **No pagination**: history capped at 20 deposits.
- **No block explorer links**: requires relayer tx tracking (see Infrastructure above).
- **Hardcoded token list**: supported tokens are defined as constants. With more time, the UI could read `TokenConfigured` events from the indexer to dynamically populate the token selector whenever a new token pair is configured on-chain.

### Dev tooling and process

- No code formatting (Prettier), Docker Compose, CI/CD (GitHub Actions), or git branching — all committed directly to `main`.
