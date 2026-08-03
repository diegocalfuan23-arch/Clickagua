import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

/**
 * El layout raíz define `title.template = "%s | FacilAgua"`. En el sitio de
 * un comité eso sobra: es su página, no la nuestra. Un template sin sufijo
 * lo anula para todo lo que cuelgue de /sitio.
 */
export const metadata: Metadata = {
  title: { absolute: "", template: "%s" },
};

/**
 * Voz tipográfica propia del sitio público: ancha, geométrica, con la
 * solidez de un letrero de carretera — deliberadamente distinta de Geist
 * (la fuente del panel y el marketing), porque esta página vive en otro
 * mundo visual, no es una sección más de la app.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sitio-display",
  weight: ["500", "700"],
});

export default function SitioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={display.variable}>{children}</div>;
}
