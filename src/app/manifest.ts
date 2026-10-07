import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aprs } from "@/lib/db/schema";

const DOMINIO_RAIZ = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "facilapr.cl";

const ICONOS: MetadataRoute.Manifest["icons"] = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  {
    src: "/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

/**
 * La PWA es del panel del socio, y cada comité vive en su subdominio
 * (pitrelahue.facilapr.cl). El proxy no toca /manifest.webmanifest (tiene
 * punto), así que el slug sale del host: cada comité instala "su" app, con su
 * nombre, y abre directo en /socio/entrar (el proxy lo reescribe al slug).
 *
 * En el dominio raíz no hay comité: devolvemos un manifest genérico que no
 * apunta a /socio, porque ahí esa ruta no existe sin slug.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const host = ((await headers()).get("host") ?? "").toLowerCase().split(":")[0];

  const slug = host.endsWith(`.${DOMINIO_RAIZ}`)
    ? host.slice(0, -(DOMINIO_RAIZ.length + 1))
    : null;

  const apr =
    slug && !slug.includes(".") && slug !== "www"
      ? await db.query.aprs.findFirst({
          where: eq(aprs.slug, slug),
          columns: { nombre: true },
        })
      : null;

  const base = {
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3607F2",
    lang: "es-CL",
    icons: ICONOS,
  } as const;

  if (!apr) {
    return {
      ...base,
      name: "Facilapr",
      short_name: "Facilapr",
      description: "Software de gestión para APR y SSR con panel para socios.",
      start_url: "/",
    };
  }

  return {
    ...base,
    id: "/socio/entrar",
    name: `${apr.nombre} — Mi cuenta`,
    short_name: "Mi APR",
    description: `Consulta tu deuda, tus boletas y tu consumo en ${apr.nombre}.`,
    start_url: "/socio/entrar",
    scope: "/socio/",
  };
}
