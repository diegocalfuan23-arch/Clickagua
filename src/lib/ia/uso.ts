import { db } from "@/lib/db";
import { usosIa } from "@/lib/db/schema";

export type ProveedorIa = "anthropic" | "openai" | "enlatada";

/**
 * Deja constancia de cuánto costó una llamada a IA. Se llama "fire and
 * forget" desde dentro del stream: registrar el gasto nunca debe demorar ni
 * romper la respuesta que ya está llegando al socio o al dirigente.
 */
export function registrarUsoIa(datos: {
  aprId: string | null;
  origen: string;
  proveedor: ProveedorIa;
  modelo: string;
  tokensEntrada: number;
  tokensSalida: number;
}) {
  db.insert(usosIa)
    .values(datos)
    .catch((e) => {
      // No hay nada mejor que hacer: la respuesta ya se envió. Solo se
      // pierde una fila de métrica, no el servicio.
      console.error("No se pudo registrar el uso de IA:", e);
    });
}
