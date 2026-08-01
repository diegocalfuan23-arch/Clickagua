import type { MetadataRoute } from "next";

/**
 * URL canónica del sitio. Sale del entorno porque el dominio se sirve en www
 * (el raíz redirige 308): si aquí quedara el raíz, Google indexaría una URL
 * que redirige y se diluiría el posicionamiento entre las dos variantes.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://www.facilagua.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel es privado: no aporta nada indexarlo.
      disallow: ["/panel/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
