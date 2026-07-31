import type { Metadata } from "next";

/**
 * El layout raíz define `title.template = "%s | FacilAgua"`. En el sitio de
 * un comité eso sobra: es su página, no la nuestra. Un template sin sufijo
 * lo anula para todo lo que cuelgue de /sitio.
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
