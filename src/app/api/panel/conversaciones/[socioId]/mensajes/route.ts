import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { historialChat } from "@/lib/chat-socio";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ socioId: string }> }
) {
  const { apr } = await requireAdmin();
  const { socioId } = await params;

  const socio = await db.query.socios.findFirst({
    where: and(eq(socios.id, socioId), eq(socios.aprId, apr.id)),
    columns: { id: true },
  });
  if (!socio) {
    return Response.json({ error: "Socio no encontrado." }, { status: 404 });
  }

  const mensajes = await historialChat(socioId);
  return Response.json(mensajes);
}
