import { config } from "./config.ts";
import { relay } from "./relay.ts";

console.log(`Relayer started. Polling every ${config.pollIntervalMs}ms`);

(async function poll() {
  await relay().catch((err) => console.error("[poll error]", err.message));
  setTimeout(poll, config.pollIntervalMs);
})();
