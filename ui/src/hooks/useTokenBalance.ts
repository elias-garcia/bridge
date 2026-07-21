import type { Chain, Hex } from "viem";
import { useReadContract } from "wagmi";
import { erc20Abi } from "../abis/erc20.ts";
import type { Token } from "../types.ts";

export function useTokenBalance(token: Token, chain: Chain, address: Hex | undefined) {
  return useReadContract({
    abi: erc20Abi,
    address: token.addresses[chain.id],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: address !== undefined },
  });
}
