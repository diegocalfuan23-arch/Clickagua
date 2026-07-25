import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/whatsapp/verify-signature";
import { whatsappQueue } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature, process.env.META_APP_SECRET!)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const messages = change.value?.messages ?? [];
      for (const msg of messages) {
        await whatsappQueue.add(
          "inbound-message",
          {
            whatsappMessageId: msg.id,
            from: msg.from,
            text: msg.text?.body ?? "",
            timestamp: msg.timestamp,
            rawEntry: change.value,
          },
          { jobId: msg.id }
        );
      }
    }
  }

  return NextResponse.json({}, { status: 200 });
}
