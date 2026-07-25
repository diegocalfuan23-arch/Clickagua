import "dotenv/config";
import { startWorker } from "@/worker";

const worker = startWorker();

console.log(`[worker pid=${process.pid}] started, waiting for jobs...`);

process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM received, closing gracefully...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[worker] SIGINT received, closing gracefully...");
  await worker.close();
  process.exit(0);
});
