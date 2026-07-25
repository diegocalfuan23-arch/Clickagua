export async function sendWhatsAppText(to: string, body: string) {
  if (process.env.WHATSAPP_DRY_RUN === "true") {
    console.log(`[WHATSAPP_DRY_RUN] to=${to} body=${body}`);
    return { dryRun: true };
  }

  const url = `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
