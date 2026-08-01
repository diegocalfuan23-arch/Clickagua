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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/registro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
