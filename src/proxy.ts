import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mapea el subdominio de cada comité a su landing y a su panel de socios.
 *
 *   pitrelahue.facilapr.cl/             → /sitio/pitrelahue
 *   pitrelahue.facilapr.cl/avisos       → /sitio/pitrelahue/avisos
 *   pitrelahue.facilapr.cl/socio/entrar → /socio/pitrelahue/entrar
 *
 * /socio/* tiene su propia rama de reescritura (no cuelga de /sitio/[slug])
 * porque es una app distinta con su propia sesión (rol SOCIO): mezclarla
 * bajo /sitio confundiría el layout público del comité con el panel privado.
 *
 * El dominio raíz y www siguen sirviendo la app normal. Los dominios propios
 * (plan Premium) se resuelven en la página por el host completo, porque aquí
 * no podemos consultar la base de datos: el proxy corre en el edge.
 */

const DOMINIO_RAIZ = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "facilapr.cl";

/** Hosts que sirven la app, no una landing de comité. */
const HOSTS_APP = new Set([
  DOMINIO_RAIZ,
  `www.${DOMINIO_RAIZ}`,
  "localhost",
]);

/**
 * El nombre anterior del producto (FacilAgua). Cualquier visita ahí, en
 * cualquier ruta, redirige 301 al dominio actual: nunca sirve la app, para
 * no partir en dos el SEO ni dejar visitas viejas en un dominio muerto.
 */
const DOMINIOS_ANTIGUOS = new Set(["facilagua.com", "www.facilagua.com"]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0]; // fuera el puerto

  if (DOMINIOS_ANTIGUOS.has(host)) {
    const destino = request.nextUrl.clone();
    destino.protocol = "https";
    destino.host = DOMINIO_RAIZ;
    destino.port = "";
    return NextResponse.redirect(destino, 301);
  }

  if (!host || HOSTS_APP.has(host)) return NextResponse.next();

  // Los previews de Vercel también sirven la app, no una landing.
  if (host.endsWith(".vercel.app")) return NextResponse.next();

  const url = request.nextUrl.clone();

  if (host.endsWith(`.${DOMINIO_RAIZ}`)) {
    const slug = host.slice(0, -(DOMINIO_RAIZ.length + 1));
    // Solo el primer nivel: "a.b.facilapr.cl" no es un comité válido.
    if (!slug || slug.includes(".")) return NextResponse.next();

    if (url.pathname.startsWith("/socio")) {
      url.pathname = `/socio/${slug}${url.pathname.slice("/socio".length)}`;
      return NextResponse.rewrite(url);
    }

    url.pathname = `/sitio/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Dominio propio: pasamos el host y la página resuelve el comité.
  url.pathname = `/sitio/dominio/${host}${
    url.pathname === "/" ? "" : url.pathname
  }`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Excluimos estáticos, imágenes y las rutas internas de la app: si el proxy
  // las tocara, un subdominio no podría cargar su propio CSS.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)",
  ],
};
