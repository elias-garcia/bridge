import type { Address } from "viem";

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  addresses: Record<number, Address>;
};

export type DepositHistoryItem = {
  key: string;
  srcChainName: string;
  dstChainName: string;
  token: Token;
  amount: bigint;
  nonce: string;
  status: "completed" | "pending";
};
