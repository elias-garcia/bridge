import { z } from "zod";

export const hexParser = (length: number) =>
  z.string().regex(new RegExp(`^0x[0-9a-fA-F]{${length}}$`)).transform((s) => s as `0x${string}`);
