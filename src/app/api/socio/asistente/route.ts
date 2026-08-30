import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { boletas, socios } from "@/lib/db/schema";
import { responder } from "@/lib/ia";
import { saldo, formatearPeriodo } from "@/lib/boletas";

/**
 * Asistente del panel de socio. A diferencia de /api/sitio/asistente (el
 * del sitio público, que nunca responde deudas porque ahí no hay forma de
 * saber quién escribe), aquí SÍ hay sesión de Better Auth con rol SOCIO: la
 * identidad ya está verificada, así que puede responder con sus propios
 * datos. Nunca los de otro socio — todo se resuelve desde la sesión, jamás
 * de un parámetro que mandara el cliente.
 */

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fechaHora = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
});

const bodySchema = z.object({
  mensajes: z
    .array(
      z.object({
        rol: z.enum(["user", "assistant"]),
        texto: z.string().trim().min(1).max(1000),
      })
    )
    .min(1)
    .max(16),
});

function construirPrompt(datos: {
  nombreSocio: string;
  nombreApr: string;
  boletas: {
    periodo: string;
    montoTotal: number;
    montoPagado: number;
    estado: string;
    fechaVencimiento: Date;
    consumoM3: number | null;
  }[];
}): string {
  const partes: string[] = [];

  partes.push(
    `Eres el asistente del panel de socios de ${datos.nombreApr}, un comité de Agua Potable Rural chileno. Le hablas a ${datos.nombreSocio}, que ya inició sesión con su RUT y clave: su identidad está verificada.

Háblale en español chileno, cercano y directo, en dos o tres frases.`
  );

  if (datos.boletas.length === 0) {
    partes.push("Este socio todavía no tiene boletas emitidas.");
  } else {
    const lista = datos.boletas.map((b) => {
      const deuda = saldo(b.montoTotal, b.montoPagado);
      const campos = [
        `- ${formatearPeriodo(b.periodo)}: total ${clp.format(b.montoTotal)}, estado ${b.estado.toLowerCase()}, vence ${fechaHora.format(b.fechaVencimiento)}`,
      ];
      if (deuda > 0) campos.push(`  Saldo pendiente: ${clp.format(deuda)}`);
      if (b.consumoM3 !== null) campos.push(`  Consumo: ${b.consumoM3} m³`);
      return campos.join("\n");
    });
    partes.push(`Sus boletas (las más recientes primero):\n${lista.join("\n")}`);
  }

  partes.push(`Reglas:
- Responde solo con los datos de arriba. Nunca inventes montos ni fechas.
- Puedes hablar de su deuda, boletas y consumo: es información de este mismo socio, ya autenticado.
- No hables de otros socios ni de datos que no aparezcan arriba.
- Si preguntan algo que no puedes resolver (reclamos, cambios de datos personales), sugiere contactar al comité directamente.
- No menciones Facilapr ni que eres una IA de un proveedor externo: hablas como el asistente del comité.`);

  return partes.join("\n\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "El asistente no está disponible por ahora." },
      { status: 503 }
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.rol !== "SOCIO") {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const socio = await db.query.socios.findFirst({
    where: eq(socios.userId, session.user.id),
    with: { apr: { columns: { nombre: true } } },
  });
  if (!socio) {
    return Response.json({ error: "Socio no encontrado." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Consulta inválida." }, { status: 400 });
  }

  const listaBoletas = await db.query.boletas.findMany({
    where: eq(boletas.socioId, socio.id),
    orderBy: [desc(boletas.fechaEmision)],
    limit: 12,
  });

  const { stream } = await responder({
    system: construirPrompt({
      nombreSocio: socio.nombre,
      nombreApr: socio.apr.nombre,
      boletas: listaBoletas,
    }),
    mensajes: parsed.data.mensajes,
    maxTokens: 700,
    respuestaEnlatada:
      "Disculpa, no pude responder en este momento. Vuelve a intentarlo en un momento.",
    aprId: socio.aprId,
    origen: "asistente-socio",
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
