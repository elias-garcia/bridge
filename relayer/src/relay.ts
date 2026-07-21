import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, lineaSepolia } from "viem/chains";
import { z } from "zod";
import { BridgeAbi } from "./abis/bridge.ts";
import { config } from "./config.ts";
import { hexParser } from "./utils.ts";

const attestor = privateKeyToAccount(config.attestorPrivateKey);

const sourceClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.sourceRpcUrl)
});
const destClient = createPublicClient({
  chain: lineaSepolia,
  transport: http(config.destRpcUrl)
});
const sourceWallet = createWalletClient({
  account: attestor,
  chain: baseSepolia,
  transport: http(config.sourceRpcUrl)
});
const destWallet = createWalletClient({
  account: attestor,
  chain: lineaSepolia,
  transport: http(config.destRpcUrl)
});


const indexerResponseSchema = z.object({
  data: z.object({
    deposits: z.object({
      items: z.array(z.object({
        id: z.string(),
        recipient: hexParser(40),
        srcChainId: z.string(),
        dstChainId: z.string(),
        srcToken: hexParser(40),
        amount: z.string(),
        nonce: z.string(),
      })),
    }),
    claims: z.object({
      items: z.array(z.object({
        nonce: z.string(),
        chainId: z.string(),
      })),
    }),
  }),
});

type Deposit = z.infer<typeof indexerResponseSchema>["data"]["deposits"]["items"][number];

async function fetchPendingDeposits(): Promise<Deposit[]> {
  const response = await fetch(`${config.indexerUrl}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
        deposits { items { id recipient srcChainId dstChainId srcToken amount nonce } }
        claims { items { nonce chainId } }
      }`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Indexer responded with ${response.status}`)
  };

  const { data } = indexerResponseSchema.parse(await response.json());

  const claimedKeys = new Set(
    data.claims.items.map((c) => `${c.chainId}-${c.nonce}`)
  );

  return data.deposits.items.filter(
    (d) => !claimedKeys.has(`${d.dstChainId}-${d.nonce}`)
  );
}

async function processDeposit(deposit: Deposit): Promise<void> {
  const srcChainId = BigInt(deposit.srcChainId);
  const dstChainId = BigInt(deposit.dstChainId);
  const amount = BigInt(deposit.amount);
  const nonce = BigInt(deposit.nonce);

  const isDestChain = dstChainId === BigInt(lineaSepolia.id);
  const destBridge = isDestChain ? config.destBridgeAddress : config.sourceBridgeAddress;
  const publicClient = isDestChain ? destClient : sourceClient;
  const walletClient = isDestChain ? destWallet : sourceWallet;

  const msgId = keccak256(
    encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" }
      ],
      [srcChainId, dstChainId, deposit.srcToken, deposit.recipient, amount, nonce]
    )
  );

  // Check on-chain before submitting (idempotency guard)
  const isDepositAlreadyProcessed = await publicClient.readContract({
    address: destBridge,
    abi: BridgeAbi,
    functionName: "processed",
    args: [msgId],
  });

  if (isDepositAlreadyProcessed) {
    console.log(`[skip] already processed: nonce=${nonce}`);
    return;
  }

  // Sign EIP-712 message
  const sig = await attestor.signTypedData({
    domain: {
      name: "Bridge",
      version: "1",
      chainId: Number(dstChainId),
      verifyingContract: destBridge,
    },
    types: {
      BridgeMessage: [
        { name: "srcChainId", type: "uint256" },
        { name: "dstChainId", type: "uint256" },
        { name: "srcToken", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "BridgeMessage",
    message: {
      srcChainId,
      dstChainId,
      srcToken: deposit.srcToken,
      recipient: deposit.recipient,
      amount,
      nonce,
    },
  });

  // Submit claim on destination bridge
  const txHash = await walletClient.writeContract({
    address: destBridge,
    abi: BridgeAbi,
    functionName: "claim",
    args: [
      {
        srcChainId,
        dstChainId,
        srcToken: deposit.srcToken,
        recipient: deposit.recipient,
        amount,
        nonce
      },
      sig,
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`[claim] nonce=${nonce} tx=${txHash}`);
}

export async function relay(): Promise<void> {
  const pendingDeposits = await fetchPendingDeposits();

  for (const pendingDeposit of pendingDeposits) {
    await processDeposit(pendingDeposit).catch((err) =>
      console.error(`[error] nonce=${pendingDeposit.nonce}`, err.message)
    );
  }
}
