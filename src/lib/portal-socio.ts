import { headers } from "next/headers";

const DOMINIO_RAIZ = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "facilapr.cl";

/**
 * Prefijo de las rutas del portal de socios según desde dónde se abre.
 *
 *  - En el subdominio del comité (quema.facilapr.cl) el proxy agrega el slug,
 *    así que las rutas van sin él: /cuenta, /cuenta/entrar.
 *  - En el dominio principal, en localhost o en un preview de Vercel no hay
 *    subdominio que lo agregue: las rutas llevan el slug, /quema/cuenta.
 *
 * El panel es la base misma (sin "/panel" al final). Con esto el portal
 * funciona igual con o sin subdominio, y se puede probar antes de tener el
 * DNS comodín. Ver src/proxy.ts para cómo se reescriben a /socio/[slug].
 */
export async function basePortal(slug: string) {
  const host = ((await headers()).get("host") ?? "").toLowerCase().split(":")[0];
  const enSubdominio =
    host.endsWith(`.${DOMINIO_RAIZ}`) && host !== `www.${DOMINIO_RAIZ}`;
  return enSubdominio ? "/cuenta" : `/${slug}/cuenta`;
}
