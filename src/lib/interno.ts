import { timingSafeEqual } from "node:crypto";

/**
 * Lo común de los endpoints internos (/api/interno/*), que solo usa el panel de
 * super admin. Se protegen con un secreto compartido (SUPERADMIN_API_SECRET) en
 * la cabecera x-api-secret: sin la variable el endpoint responde 503, y con un
 * secreto incorrecto o corto, 401.
 */

/** Comparación en tiempo constante: no filtra cuánto del secreto se acertó. */
function secretoValido(recibido: string | null) {
  const esperado = process.env.SUPERADMIN_API_SECRET;
  if (!esperado || esperado.length < 24 || !recibido) return false;

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function respuesta(estado: number, cuerpo: Record<string, unknown>) {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Devuelve la respuesta de error si la petición no está autorizada; null si puede seguir. */
export function exigirSecreto(req: Request): Response | null {
  if (!process.env.SUPERADMIN_API_SECRET) {
    return respuesta(503, { error: "El endpoint no está configurado." });
  }
  if (!secretoValido(req.headers.get("x-api-secret"))) {
    return respuesta(401, { error: "No autorizado." });
  }
  return null;
}
