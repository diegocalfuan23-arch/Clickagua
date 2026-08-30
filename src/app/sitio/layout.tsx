import type { Metadata } from "next";

/**
 * El layout raíz define `title.template = "%s | Facilapr"`. En el sitio de
 * un comité eso sobra: es su página, no la nuestra. Un template sin sufijo
 * lo anula para todo lo que cuelgue de /sitio.
 *
 * Sin fuente propia: esta página hereda el stack tipográfico de la landing
 * (Geist, ya cargada en el layout raíz) — mismo sistema visual del software,
 * no una identidad aparte.
 */
export const metadata: Metadata = {
  title: { absolute: "", template: "%s" },
};

export default function SitioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
