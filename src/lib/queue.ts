import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const WHATSAPP_INBOUND_QUEUE = "whatsapp-inbound";

export type InboundMessageJob = {
  whatsappMessageId: string;
  from: string;
  text: string;
  timestamp: string;
  rawEntry: unknown;
};

export const whatsappQueue = new Queue<InboundMessageJob>(
  WHATSAPP_INBOUND_QUEUE,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  }
);
