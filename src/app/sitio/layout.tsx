import type { Metadata } from "next";
import { Newsreader } from "next/font/google";

/**
 * El layout raíz define `title.template = "%s | FacilAgua"`. En el sitio de
 * un comité eso sobra: es su página, no la nuestra. Un template sin sufijo
 * lo anula para todo lo que cuelgue de /sitio.
 */
export const metadata: Metadata = {
  title: { absolute: "", template: "%s" },
};

/**
 * Serif itálica cálida para los mensajes del comité ("Nuestro compromiso...").
 * Referencia real: sitios de APR chilenos existentes usan cursiva para ese
 * tipo de frase — se ve humano, no corporativo. Newsreader en vez de una
 * fuente "manuscrita" para no caer en lo infantil.
 */
const calida = Newsreader({
  subsets: ["latin"],
  variable: "--font-sitio-calida",
  style: ["italic"],
  weight: ["500", "600"],
});

export default function SitioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={calida.variable}>{children}</div>;
}
