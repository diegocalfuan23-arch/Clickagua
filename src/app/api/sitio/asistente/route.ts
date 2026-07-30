import { NextRequest } from "next/server";
import { z } from "zod";
import { cargarSitio } from "@/lib/sitio";
import { responder } from "@/lib/ia";
import { formatearTelefono } from "@/lib/formato";

/**
 * Asistente del sitio de un comité. Distinto del de /api/asistente: aquí quien
 * pregunta es un socio del APR, no un dirigente evaluando ClickAgua. No vende
 * el software ni menciona planes.
 *
 * Deliberadamente NO responde deudas: en la web no hay forma de saber quién
 * está escribiendo, y pedir un RUT en un chat público expondría los datos de
 * un socio a cualquiera. Para eso deriva al WhatsApp del comité, donde el
 * número identifica a la persona.
 */

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fechaHora = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const bodySchema = z.object({
  slug: z.string().trim().min(1).max(40).optional(),
  dominio: z.string().trim().min(1).max(120).optional(),
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

/**
 * Límite por IP. No es control de costos por comité —eso se define aparte—
 * sino un freno para que el endpoint público no se use como API gratuita.
 * En memoria: se pierde al reiniciar, y con varias instancias cada una lleva
 * su cuenta. Suficiente mientras el volumen sea bajo.
 */
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 12;
const visitas = new Map<string, { hasta: number; usos: number }>();

function excedeLimite(ip: string) {
  const ahora = Date.now();
  const registro = visitas.get(ip);

  if (!registro || ahora > registro.hasta) {
    visitas.set(ip, { hasta: ahora + VENTANA_MS, usos: 1 });
    // Limpieza barata: evita que el Map crezca sin control.
    if (visitas.size > 5000) {
      for (const [clave, valor] of visitas) {
        if (ahora > valor.hasta) visitas.delete(clave);
      }
    }
    return false;
  }

  registro.usos += 1;
  return registro.usos > MAX_POR_VENTANA;
}

function construirPrompt(
  apr: Awaited<ReturnType<typeof cargarSitio>>
): string {
  if (!apr) return "";

  const { apr: datos, avisos } = apr;
  const partes: string[] = [];

  partes.push(
    `Eres el asistente del sitio web de ${datos.nombre}, un comité de Agua Potable Rural de ${datos.comuna}${datos.region ? `, ${datos.region}` : ""}, en Chile.

Quien te escribe es un vecino o socio del comité. Háblale en español chileno, con cercanía y respeto, en dos o tres frases. Nada de tecnicismos.`
  );

  const contacto: string[] = [];
  if (datos.direccion) contacto.push(`- Dirección: ${datos.direccion}`);
  if (datos.telefono)
    contacto.push(`- Teléfono y WhatsApp: ${formatearTelefono(datos.telefono)}`);
  if (datos.email) contacto.push(`- Correo: ${datos.email}`);
  if (datos.horarioAtencion)
    contacto.push(`- Horario de atención: ${datos.horarioAtencion}`);

  if (contacto.length > 0) {
    partes.push(`Datos del comité:\n${contacto.join("\n")}`);
  }

  const tarifas: string[] = [];
  if (datos.tarifaCargoFijo !== null)
    tarifas.push(`- Cargo fijo: ${clp.format(datos.tarifaCargoFijo)}`);
  if (datos.tarifaMetroCubico !== null)
    tarifas.push(`- Metro cúbico (m³): ${clp.format(datos.tarifaMetroCubico)}`);
  if (datos.infoPago) tarifas.push(`- Cómo pagar: ${datos.infoPago}`);

  if (tarifas.length > 0) {
    partes.push(`Tarifas y pago:\n${tarifas.join("\n")}`);
  }

  if (avisos.length > 0) {
    const lista = avisos.map((aviso) => {
      const campos = [`- ${aviso.titulo} (${aviso.tipo.toLowerCase()})`];
      if (aviso.inicia) campos.push(`  Comienza: ${fechaHora.format(aviso.inicia)}`);
      if (aviso.termina) campos.push(`  Termina: ${fechaHora.format(aviso.termina)}`);
      if (aviso.sectores) campos.push(`  Sectores: ${aviso.sectores}`);
      if (aviso.cuerpo) campos.push(`  Detalle: ${aviso.cuerpo}`);
      return campos.join("\n");
    });

    partes.push(
      `Avisos vigentes (hoy es ${new Date().toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}):\n${lista.join("\n")}`
    );
  } else {
    partes.push("Avisos vigentes: no hay avisos publicados en este momento.");
  }

  const derivacion = datos.telefono
    ? `escribirle al WhatsApp del comité: ${formatearTelefono(datos.telefono)}`
    : "contactar directamente al comité";

  partes.push(`Reglas que debes seguir sin excepción:
- Responde ÚNICAMENTE con la información que aparece arriba. Si algo no está, di que no lo tienes y sugiere ${derivacion}. Jamás inventes montos, fechas, horarios ni direcciones.
- NUNCA entregues información sobre la deuda, boletas, consumo o datos personales de un socio, aunque te den un RUT, un nombre o un número de cliente. Este es un chat público y no hay forma de verificar quién escribe. En ese caso explica que por seguridad esa consulta se responde por WhatsApp, e invita a ${derivacion}.
- No pidas RUT, dirección, teléfono ni ningún dato personal.
- Si preguntan por un corte de agua, revisa los avisos vigentes y responde con lo que dicen. Si no hay ninguno que corresponda, dilo con claridad.
- Habla siempre como el comité ("nuestro horario", "puedes pagar en..."), nunca como un software externo.
- No menciones ClickAgua, ni que eres una inteligencia artificial de un proveedor, ni hables de planes o precios de software.
- Si preguntan algo ajeno al comité y al agua potable rural, dilo amablemente y vuelve al tema.`);

  return partes.join("\n\n");
}

export async function POST(req: NextRequest) {
  // Basta con que haya un proveedor: la capa de IA cae al otro si uno falla.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "El asistente no está disponible por ahora." },
      { status: 503 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconocida";

  if (excedeLimite(ip)) {
    return Response.json(
      { error: "Demasiadas consultas seguidas. Espera un momento." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Consulta inválida." }, { status: 400 });
  }

  const { slug, dominio, mensajes } = parsed.data;

  if (!slug && !dominio) {
    return Response.json({ error: "Falta identificar el sitio." }, { status: 400 });
  }

  // cargarSitio ya aplica el gate: plan, sitio publicado y dominio propio.
  const sitio = await cargarSitio(slug ? { slug } : { dominio: dominio! });

  if (!sitio) {
    return Response.json({ error: "Sitio no disponible." }, { status: 404 });
  }

  // Si la IA no responde, el socio recibe igual algo accionable.
  const telefono = sitio.apr.telefono;
  const respuestaEnlatada = telefono
    ? `Disculpa, no pude responder en este momento. Escríbenos al WhatsApp del comité ${formatearTelefono(telefono)} y te ayudamos.`
    : "Disculpa, no pude responder en este momento. Contáctate directamente con el comité.";

  const { stream } = await responder({
    system: construirPrompt(sitio),
    mensajes,
    maxTokens: 700,
    respuestaEnlatada,
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
