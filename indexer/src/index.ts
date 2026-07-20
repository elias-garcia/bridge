import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("SourceBridge:Deposited", async ({ event, context }) => {
  const { recipient, srcChainId, dstChainId, srcToken, amount, nonce } = event.args;

  await context.db.insert(schema.deposit).values({
    id: event.id,
    recipient,
    srcChainId,
    dstChainId,
    srcToken,
    amount,
    nonce,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });
});

ponder.on("DestBridge:Deposited", async ({ event, context }) => {
  const { recipient, srcChainId, dstChainId, srcToken, amount, nonce } = event.args;

  await context.db.insert(schema.deposit).values({
    id: event.id,
    recipient,
    srcChainId,
    dstChainId,
    srcToken,
    amount,
    nonce,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });
});

ponder.on("SourceBridge:Claimed", async ({ event, context }) => {
  const { recipient, localToken, amount, nonce } = event.args;

  await context.db.insert(schema.claim).values({
    id: event.id,
    recipient,
    localToken,
    amount,
    nonce,
    chainId: BigInt(context.chain.id),
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });
});

ponder.on("DestBridge:Claimed", async ({ event, context }) => {
  const { recipient, localToken, amount, nonce } = event.args;

  await context.db.insert(schema.claim).values({
    id: event.id,
    recipient,
    localToken,
    amount,
    nonce,
    chainId: BigInt(context.chain.id),
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });
});
