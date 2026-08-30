import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * URL canónica del sitio. Sale del entorno porque facilapr.cl se sirve sin
 * www (www.facilapr.cl redirige al dominio raíz): si aquí quedara la
 * variante equivocada, Google indexaría una URL que redirige y se diluiría
 * el posicionamiento entre las dos variantes.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://facilapr.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Facilapr — Software de gestión para APR y SSR con atención por WhatsApp",
    template: "%s | Facilapr",
  },
  description:
    "Software para comités de Agua Potable Rural en Chile: administra socios, boletas y pagos, y responde automáticamente por WhatsApp cuánto debe cada socio.",
  keywords: [
    "software APR",
    "sistema de gestión APR",
    "software agua potable rural",
    "gestión APR Chile",
    "software SSR",
    "servicios sanitarios rurales",
    "boletas agua potable rural",
    "comité de agua potable rural",
  ],
  applicationName: "Facilapr",
  authors: [{ name: "Facilapr" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "Facilapr",
    title: "Facilapr — Software de gestión para APR y SSR",
    description:
      "Administra socios, boletas y pagos de tu comité de Agua Potable Rural, y responde consultas de deuda automáticamente por WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Facilapr — Software de gestión para APR y SSR",
    description:
      "Administra socios, boletas y pagos de tu APR, y responde consultas por WhatsApp de forma automática.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
