# Bridge Contracts

Solidity contracts for a lock-and-mint token bridge between Base Sepolia and Linea Sepolia. Built with Foundry and OpenZeppelin v5.

## Contracts

- **`Token`** — ERC20 with EIP-2612 permit and an open mint faucet. Deployed on the source chain (Base Sepolia).
- **`WrappedToken`** — ERC20 with EIP-2612 permit. Mint and burn are gated by `MINTER_ROLE`, held exclusively by the Bridge. Deployed on the destination chain (Linea Sepolia).
- **`Bridge`** — Symmetric contract, same bytecode on both chains. Behaviour per token is determined by its configured `Mode`:
  - `LOCK` — canonical token: escrowed on deposit, released on claim.
  - `MINT` — wrapped token: burned on deposit, minted on claim.
- **`IMintable`** — Interface that wrapped tokens must implement to be compatible with the Bridge.

## Setup

Copy `.env.example` to `.env` and fill in your values:

```shell
cp .env.example .env
```

| Variable | Description |
|---|---|
| `BASE_SEPOLIA_RPC_URL` | RPC endpoint for Base Sepolia |
| `LINEA_SEPOLIA_RPC_URL` | RPC endpoint for Linea Sepolia |
| `ATTESTOR_ADDRESS` | Address of the attestor key held by the relayer |
| `ADMIN_ADDRESS` | Address of the admin/deployer |

## Deploy

Run the four scripts in order. After steps 1 and 2, copy the logged addresses into steps 3 and 4.

**1. Deploy Token + Bridge on Base Sepolia**
```shell
forge script script/DeploySource.s.sol \
  --rpc-url base_sepolia --private-key <PRIVATE_KEY> --broadcast
```

**2. Deploy WrappedToken + Bridge on Linea Sepolia**
```shell
forge script script/DeployDest.s.sol \
  --rpc-url linea_sepolia --private-key <PRIVATE_KEY> --broadcast
```

**3. Configure Base Sepolia bridge**
```shell
forge script script/Configure.s.sol \
  --sig "run(uint256,address,address,uint256,address,address)" \
  84532 <SOURCE_TOKEN> <SOURCE_BRIDGE> 59141 <DEST_TOKEN> <DEST_BRIDGE> \
  --rpc-url base_sepolia --private-key <PRIVATE_KEY> --broadcast
```

**4. Configure Linea Sepolia bridge**
```shell
forge script script/Configure.s.sol \
  --sig "run(uint256,address,address,uint256,address,address)" \
  84532 <SOURCE_TOKEN> <SOURCE_BRIDGE> 59141 <DEST_TOKEN> <DEST_BRIDGE> \
  --rpc-url linea_sepolia --private-key <PRIVATE_KEY> --broadcast
```

## Local testing with Anvil

Start two Anvil instances in separate terminals:

```shell
anvil --chain-id 84532 --port 8545   # Base Sepolia
anvil --chain-id 59141 --port 8546   # Linea Sepolia
```

Set the following in your `.env` for local testing:

```
BASE_SEPOLIA_RPC_URL=http://localhost:8545
LINEA_SEPOLIA_RPC_URL=http://localhost:8546
ATTESTOR_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Use Anvil account #0 as `<PRIVATE_KEY>`: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
