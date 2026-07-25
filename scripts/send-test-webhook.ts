import "dotenv/config";
import { createHmac, randomUUID } from "node:crypto";

const phone = process.argv.includes("--phone")
  ? process.argv[process.argv.indexOf("--phone") + 1]
  : "56912345678";

const text = process.argv.includes("--text")
  ? process.argv[process.argv.indexOf("--text") + 1]
  : "cuanto debo";

const messageId = `wamid.TEST-${randomUUID()}`;

const payload = {
  entry: [
    {
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: { phone_number_id: "TEST_PHONE_NUMBER_ID" },
            messages: [
              {
                id: messageId,
                from: phone,
                timestamp: `${Math.floor(Date.now() / 1000)}`,
                text: { body: text },
                type: "text",
              },
            ],
          },
        },
      ],
    },
  ],
};

const rawBody = JSON.stringify(payload);
const appSecret = process.env.META_APP_SECRET || "";
const signature =
  "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

const url = process.env.WEBHOOK_URL || "http://localhost:3000/api/whatsapp/webhook";

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hub-signature-256": signature,
  },
  body: rawBody,
});

console.log(`POST ${url} -> ${res.status}`);
console.log(await res.text());
console.log(`messageId: ${messageId}`);
