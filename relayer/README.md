# Bridge Relayer

Polls the indexer for pending deposits, signs EIP-712 attestations, and submits `claim()` transactions on the destination chain.

## Setup

```bash
cp .env.example .env
npm install
```

| Variable | Description |
|---|---|
| `BASE_SEPOLIA_RPC_URL` | RPC endpoint for Base Sepolia |
| `LINEA_SEPOLIA_RPC_URL` | RPC endpoint for Linea Sepolia |
| `SOURCE_BRIDGE_ADDRESS` | Bridge contract address on Base Sepolia |
| `DEST_BRIDGE_ADDRESS` | Bridge contract address on Linea Sepolia |
| `ATTESTOR_PRIVATE_KEY` | Private key of the attestor wallet |
| `INDEXER_URL` | Indexer GraphQL endpoint (default: `http://localhost:42069`) |
| `POLL_INTERVAL_MS` | Polling interval in milliseconds (default: `3000`) |

## Run

```bash
npm start
```
