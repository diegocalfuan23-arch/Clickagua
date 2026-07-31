const SITE_URL = "https://facilagua.com";

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FacilAgua",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Software de gestión para comités de Agua Potable Rural (APR) y Servicios Sanitarios Rurales (SSR) en Chile. Administra socios, boletas y pagos, y responde consultas de deuda automáticamente por WhatsApp.",
  inLanguage: "es-CL",
  areaServed: { "@type": "Country", name: "Chile" },
  offers: [
    {
      "@type": "Offer",
      name: "Comité Pequeño",
      description: "Para APR con hasta 200 socios.",
      price: "0.7",
      priceCurrency: "CLF",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Comité Estándar",
      description: "Para APR con hasta 800 socios.",
      price: "1.5",
      priceCurrency: "CLF",
      availability: "https://schema.org/InStock",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Dónde quedan guardados los datos de nuestros socios?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En una base de datos propia de tu APR, separada de cualquier otro comité. Nunca compartimos ni vendemos información de socios a terceros.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo cargamos las boletas que ya tenemos en Excel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Se importan directamente desde una planilla CSV con el formato que ya suelen usar los APR (socio, RUT, periodo, monto). Te acompañamos en la primera carga.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesitamos instalar algo o cambiar de número de WhatsApp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No hay que instalar nada. Puedes usar un número nuevo dedicado o migrar el que ya usan los socios para contactar al comité, conectado a la API oficial de WhatsApp de Meta.",
      },
    },
    {
      "@type": "Question",
      name: "¿Hay contrato de permanencia mínima?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Puedes darte de baja cuando lo estime la directiva, sin multas ni plazos forzosos.",
      },
    },
  ],
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
