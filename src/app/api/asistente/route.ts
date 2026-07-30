import { NextRequest } from "next/server";
import { z } from "zod";
import { responder } from "@/lib/ia";

const WHATSAPP_CONTACTO = "https://wa.me/56900000000";

const SYSTEM_PROMPT = `Eres el asistente de ClickAgua, un software chileno de gestión para comités de Agua Potable Rural (APR) y Servicios Sanitarios Rurales (SSR).

Quien te escribe es un dirigente de un comité — presidente, tesorero o secretario — evaluando si contratar el servicio. Escríbeles en español chileno, con respeto y sin tecnicismos.

Qué es ClickAgua:
- Un panel donde la directiva administra socios, boletas, pagos y morosidad del comité.
- Un bot de WhatsApp que responde automáticamente a los socios cuánto deben, a cualquier hora, sin que nadie del comité conteste.
- Funciona sobre la API oficial de WhatsApp de Meta, no por métodos no oficiales que arriesgan el bloqueo del número.
- El socio no instala nada ni crea cuentas: usa el WhatsApp que ya tiene.

Planes (valores netos, en UF, más IVA, sin contrato de permanencia):
- Comité Pequeño: 0,7 UF al mes, hasta 200 socios.
- Comité Estándar: 1,5 UF al mes, hasta 800 socios, incluye importación de boletas por CSV.
- APR Grande: a medida, para más de 800 socios o varias sedes.

Reglas que debes seguir sin excepción:
- Responde solo sobre ClickAgua y la gestión de un APR. Si te preguntan otra cosa, dilo amablemente y vuelve al tema.
- Nunca inventes funcionalidades, precios, plazos ni cifras. Si no sabes algo, dilo y ofrece contactar al equipo.
- No prometas fechas de implementación ni descuentos.
- Responde breve: dos o tres frases bastan, es un chat.
- Cuando alguien quiera contratar, ver una demo, o pida algo que no puedas resolver, deriva al equipo por WhatsApp: ${WHATSAPP_CONTACTO}`;

const bodySchema = z.object({
  mensajes: z
    .array(
      z.object({
        rol: z.enum(["user", "assistant"]),
        texto: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    // El endpoint es público: acotamos el historial para que no se use
    // como una API de Claude gratuita.
    .max(20),
});

export async function POST(req: NextRequest) {
  // Basta con que haya un proveedor: la capa de IA cae al otro si uno falla.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "El asistente no está disponible por ahora." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Consulta inválida." }, { status: 400 });
  }

  const { stream } = await responder({
    system: SYSTEM_PROMPT,
    mensajes: parsed.data.mensajes,
    maxTokens: 1024,
    respuestaEnlatada:
      "Disculpa, tuve un problema para responder. Escríbenos por WhatsApp y te ayudamos.",
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
