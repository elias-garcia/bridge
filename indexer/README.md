# Bridge Indexer

[Ponder](https://ponder.sh)-based indexer that tracks `Deposited` and `Claimed` events from both chains and exposes a GraphQL API.

## Setup

```bash
cp .env.example .env
npm install
```

| Variable | Description |
|---|---|
| `PONDER_RPC_URL_84532` | RPC endpoint for Base Sepolia |
| `PONDER_RPC_URL_59141` | RPC endpoint for Linea Sepolia |
| `SOURCE_BRIDGE_ADDRESS` | Bridge contract address on Base Sepolia |
| `DEST_BRIDGE_ADDRESS` | Bridge contract address on Linea Sepolia |
| `SOURCE_BRIDGE_START_BLOCK` | Block to start indexing from on Base Sepolia |
| `DEST_BRIDGE_START_BLOCK` | Block to start indexing from on Linea Sepolia |

## Run

```bash
npm run dev             # starts on http://localhost:42069
```

The GraphQL playground is available at `http://localhost:42069/graphql`.
