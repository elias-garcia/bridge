import type { Address, Chain } from "viem";
import { useWalletClient, usePublicClient } from "wagmi";
import { erc20Abi } from "../abis/erc20.ts";
import { bridgeAbi } from "../abis/bridge.ts";
import { BRIDGE_ADDRESS } from "../constants.ts";
import type { Token } from "../types.ts";

export function useBridge(token: Token, chain: Chain, amount: bigint) {
  const publicClient = usePublicClient({ chainId: chain.id });
  const { data: walletClient } = useWalletClient({ chainId: chain.id });

  async function bridge(recipient: Address): Promise<void> {
    const tokenAddress = token.addresses[chain.id];

    if (!tokenAddress) {
      throw new Error(`Token ${token.symbol} is not supported on ${chain.name}`);
    }

    if (!publicClient || !walletClient) {
      throw new Error(`No client available for ${chain.name}`);
    }

    const allowance = await publicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "allowance",
      args: [recipient, BRIDGE_ADDRESS],
    });

    if (allowance < amount) {
      const approveTxHash = await walletClient.writeContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "approve",
        args: [BRIDGE_ADDRESS, amount],
      });
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

      if (approveReceipt.status === "reverted") {
        throw new Error("Approve transaction reverted");
      }
    }

    const depositTxHash = await walletClient.writeContract({
      abi: bridgeAbi,
      address: BRIDGE_ADDRESS,
      functionName: "deposit",
      args: [tokenAddress, amount, recipient],
    });
    const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositTxHash });

    if (depositReceipt.status === "reverted") {
      throw new Error("Deposit transaction reverted");
    }
  }

  return { bridge, isReady: publicClient !== undefined && walletClient !== undefined };
}
