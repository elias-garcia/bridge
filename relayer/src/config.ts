import "dotenv/config";
import { z } from "zod";
import { hexParser } from "./utils.ts";

const envSchema = z.object({
  BASE_SEPOLIA_RPC_URL: z.url(),
  LINEA_SEPOLIA_RPC_URL: z.url(),
  SOURCE_BRIDGE_ADDRESS: hexParser(40),
  DEST_BRIDGE_ADDRESS: hexParser(40),
  ATTESTOR_PRIVATE_KEY: hexParser(64),
  INDEXER_URL: z.url(),
  POLL_INTERVAL_MS: z.coerce.number().positive().default(3000),
});

const env = envSchema.parse(process.env);

export const config = {
  sourceRpcUrl: env.BASE_SEPOLIA_RPC_URL,
  destRpcUrl: env.LINEA_SEPOLIA_RPC_URL,
  sourceBridgeAddress: env.SOURCE_BRIDGE_ADDRESS,
  destBridgeAddress: env.DEST_BRIDGE_ADDRESS,
  attestorPrivateKey: env.ATTESTOR_PRIVATE_KEY,
  indexerUrl: env.INDEXER_URL,
  pollIntervalMs: env.POLL_INTERVAL_MS,
};
