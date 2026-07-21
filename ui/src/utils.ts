import { parseUnits } from "viem";

export function parseAmount(value: string, decimals: number): bigint {
  try {
    return parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}
