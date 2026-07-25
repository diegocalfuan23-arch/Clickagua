import { Worker } from "bullmq";
import { redisConnection } from "@/lib/redis";
import { WHATSAPP_INBOUND_QUEUE, type InboundMessageJob } from "@/lib/queue";
import { processInboundMessage } from "./process-message";

export function startWorker() {
  const worker = new Worker<InboundMessageJob>(
    WHATSAPP_INBOUND_QUEUE,
    async (job) => {
      console.log(`[worker pid=${process.pid}] processing job ${job.id}`);
      await processInboundMessage(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[worker] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
  });

  return worker;
}
