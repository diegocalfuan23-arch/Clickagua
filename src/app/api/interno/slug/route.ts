import { NextRequest } from "next/server";
import { z } from "zod";
import { exigirSecreto, respuesta } from "@/lib/interno";
import { cambiarSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

/**
 * Cambia la dirección (slug) de un comité, pedida por el panel de super admin.
 * La escritura queda aquí, en Facilapr, con las mismas reglas que cuando el
 * propio comité lo cambia desde Configuración. Protegido por el secreto
 * compartido (SUPERADMIN_API_SECRET).
 */
const cuerpoSchema = z.object({
  aprId: z.string().min(1).max(64),
  slug: z.string().max(60),
});

export async function POST(req: NextRequest) {
  const noAutorizado = exigirSecreto(req);
  if (noAutorizado) return noAutorizado;

  const parsed = cuerpoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return respuesta(400, { error: "Datos inválidos." });
  }

  const resultado = await cambiarSlug(parsed.data.aprId, parsed.data.slug);
  if (!resultado.ok) {
    return respuesta(400, { error: resultado.error, campo: "slug" });
  }

  return respuesta(200, { ok: true, slug: resultado.slug });
}
