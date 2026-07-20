import { onchainTable } from "ponder";

export const deposit = onchainTable("deposit", (t) => ({
  id: t.text().primaryKey(), // ponder event id: `${chainId}-${blockNumber}-${logIndex}`
  recipient: t.hex().notNull(),
  srcChainId: t.bigint().notNull(),
  dstChainId: t.bigint().notNull(),
  srcToken: t.hex().notNull(),
  amount: t.bigint().notNull(),
  nonce: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}));

export const claim = onchainTable("claim", (t) => ({
  id: t.text().primaryKey(),
  recipient: t.hex().notNull(),
  localToken: t.hex().notNull(),
  amount: t.bigint().notNull(),
  nonce: t.bigint().notNull(),
  chainId: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}));
