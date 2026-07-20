import { createConfig } from "ponder";
import { getAddress } from "viem";
import { BridgeAbi } from "./abis/BridgeAbi";

export default createConfig({
  database: {
    kind: "pglite",
  },
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: process.env.PONDER_RPC_URL_84532,
    },
    lineaSepolia: {
      id: 59141,
      rpc: process.env.PONDER_RPC_URL_59141,
    },
  },
  contracts: {
    SourceBridge: {
      chain: "baseSepolia",
      abi: BridgeAbi,
      address: getAddress(process.env.SOURCE_BRIDGE_ADDRESS!),
      startBlock: Number(process.env.SOURCE_BRIDGE_START_BLOCK ?? 0),
    },
    DestBridge: {
      chain: "lineaSepolia",
      abi: BridgeAbi,
      address: getAddress(process.env.DEST_BRIDGE_ADDRESS!),
      startBlock: Number(process.env.DEST_BRIDGE_START_BLOCK ?? 0),
    },
  },
});
