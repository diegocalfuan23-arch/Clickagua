import type { MetadataRoute } from "next";

const SITE_URL = "https://facilagua.com";

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
