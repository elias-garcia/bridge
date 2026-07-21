import type { Address } from "viem";
import { baseSepolia, lineaSepolia } from "wagmi/chains";
import type { Token } from "./types.ts";

export const SUPPORTED_CHAINS = [baseSepolia, lineaSepolia] as const;

export const BRIDGE_ADDRESS: Address = "0x8B345b1261D017c020C11C5E50B3c66865c4aF97";

export const SUPPORTED_TOKENS: Token[] = [
  {
    symbol: "ARKV",
    name: "Arkiv Token",
    decimals: 18,
    addresses: {
      [baseSepolia.id]: "0xA668a7997b0F000D2D4765C233413Fac05c3307e",
      [lineaSepolia.id]: "0xA668a7997b0F000D2D4765C233413Fac05c3307e",
    },
  },
];
