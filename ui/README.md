# Bridge UI

React frontend for the token bridge. Handles wallet connection, approve + deposit in a single flow, and displays transaction history with auto-refresh.

## Setup

```bash
cp .env.example .env
npm install
```

| Variable | Description |
|---|---|
| `VITE_BASE_SEPOLIA_RPC_URL` | RPC endpoint for Base Sepolia |
| `VITE_LINEA_SEPOLIA_RPC_URL` | RPC endpoint for Linea Sepolia |
| `VITE_INDEXER_URL` | Indexer GraphQL endpoint (default: `http://localhost:42069`) |

## Run

```bash
npm run dev                # development with hot reload (http://localhost:5173)
npm run build && npm run preview   # production build + serve
```
