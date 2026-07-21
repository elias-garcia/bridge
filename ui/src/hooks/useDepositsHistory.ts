import { useQuery } from "@tanstack/react-query";
import { type Address } from "viem";
import { z } from "zod";
import { SUPPORTED_CHAINS, SUPPORTED_TOKENS } from "../constants.ts";
import type { DepositHistoryItem } from "../types.ts";

const QUERY = `
  query GetHistory($recipient: String!) {
    deposits(where: { recipient: $recipient }, orderBy: "blockTimestamp", orderDirection: "desc", limit: 20) {
      items {
        srcChainId
        dstChainId
        srcToken
        amount
        nonce
      }
    }
    claims(where: { recipient: $recipient }) {
      items {
        nonce
        chainId
      }
    }
  }
`;

const depositSchema = z
  .object({
    srcChainId: z.string(),
    dstChainId: z.string(),
    srcToken: z.string(),
    amount: z.string(),
    nonce: z.string(),
  })
  .transform((d, ctx) => {
    const srcChainId = Number(d.srcChainId);
    const dstChainId = Number(d.dstChainId);

    const srcChain = SUPPORTED_CHAINS.find((c) => c.id === srcChainId);
    const dstChain = SUPPORTED_CHAINS.find((c) => c.id === dstChainId);
    const token = SUPPORTED_TOKENS.find(
      (t) => t.addresses[srcChainId]?.toLowerCase() === d.srcToken.toLowerCase()
    );

    if (!srcChain || !dstChain || !token) {
      ctx.addIssue({ code: "custom", message: "Unknown chain or token" });
      return z.NEVER;
    }

    return {
      srcChainName: srcChain.name,
      dstChainName: dstChain.name,
      token,
      amount: BigInt(d.amount),
      nonce: d.nonce,
      srcChainId: d.srcChainId,
      dstChainId: d.dstChainId,
    };
  });

const claimSchema = z.object({
  nonce: z.string(),
  chainId: z.string(),
});

const responseSchema = z.object({
  data: z.object({
    deposits: z.object({ items: z.array(depositSchema) }),
    claims: z.object({ items: z.array(claimSchema) }),
  }),
});

async function fetchHistory(recipient: Address): Promise<DepositHistoryItem[]> {
  const res = await fetch(import.meta.env.VITE_INDEXER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { recipient } }),
  });

  const { data } = responseSchema.parse(await res.json());
  const { deposits, claims } = data;

  const completedNonces = new Set(
    claims.items
      .filter((c) => deposits.items.some((d) => d?.nonce === c.nonce && d.dstChainId === c.chainId))
      .map((c) => c.nonce)
  );

  return deposits.items.map((d) => ({
    key: `${d.srcChainId}-${d.nonce}`,
    srcChainName: d.srcChainName,
    dstChainName: d.dstChainName,
    token: d.token,
    amount: d.amount,
    nonce: d.nonce,
    status: completedNonces.has(d.nonce) ? "completed" : "pending",
  }));
}

export function useDepositsHistory(address: Address | undefined) {
  return useQuery({
    queryKey: ["deposits-history", address],
    queryFn: () => fetchHistory(address!),
    enabled: !!address && !!import.meta.env.VITE_INDEXER_URL,
    refetchInterval: 5000,
  });
}
