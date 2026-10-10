import { NextRequest } from "next/server";
import { boletaIdDeCodigo } from "@/lib/recibo-enlace";
import { generarReciboPdf } from "@/lib/recibo-pdf";
import { reciboPorId } from "@/lib/recibo";

/**
 * Recibo en PDF a partir del enlace firmado que va en el WhatsApp. Sin sesión:
 * lo que protege el recibo es que el código es imposible de adivinar. Un código
 * alterado, o una boleta anulada, responde 404 sin dar pistas.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;

  const boletaId = boletaIdDeCodigo(decodeURIComponent(codigo));
  if (!boletaId) return new Response("No encontrado.", { status: 404 });

  const recibo = await reciboPorId(boletaId);
  if (!recibo || recibo.estado === "ANULADA") {
    return new Response("No encontrado.", { status: 404 });
  }

  const pdf = await generarReciboPdf(recibo);
  const nombre = `Recibo ${recibo.periodo} ${recibo.socio.nombre}`
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${nombre}.pdf"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
