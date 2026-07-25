import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader) return false;

  const expected =
    "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}
