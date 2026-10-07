import { formatearPeriodo, saldo } from "@/lib/boletas";

/**
 * Envío de boletas por WhatsApp SIN la API de Meta: armamos un link wa.me con
 * el mensaje ya escrito y la directiva solo toca "enviar". Es a propósito: la
 * API oficial exige verificación del negocio y plantillas aprobadas, y el
 * producto ya descartó ese trámite (ver facilapr-sin-whatsapp). Si algún día
 * 150 toques al mes pesan, el reemplazo es enviar desde un worker; el texto
 * de `mensajeBoleta` se reutiliza tal cual.
 */

const DOMINIO_RAIZ = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "facilapr.cl";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const diaMes = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
});

/** El teléfono se guarda en E.164 (+56912345678). Cualquier otra cosa no sirve para wa.me. */
export function telefonoValidoParaWhatsApp(telefono: string | null | undefined) {
  return Boolean(telefono && /^\+\d{8,15}$/.test(telefono));
}

export function enlaceWhatsApp(telefono: string, texto: string) {
  return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}

export type DatosComiteWhatsApp = {
  nombre: string;
  slug: string | null;
  infoPago: string | null;
};

export type DatosBoletaWhatsApp = {
  socioNombre: string;
  periodo: string;
  montoTotal: number;
  montoPagado: number;
  fechaVencimiento: Date;
  consumoM3: number | null;
};

export function mensajeBoleta(
  comite: DatosComiteWhatsApp,
  boleta: DatosBoletaWhatsApp
) {
  const porPagar = saldo(boleta.montoTotal, boleta.montoPagado);
  const abonada = boleta.montoPagado > 0 && porPagar > 0;
  const primerNombre = boleta.socioNombre.trim().split(/\s+/)[0];

  const lineas = [
    `Hola ${primerNombre}, te escribe ${comite.nombre}.`,
    "",
    `Tu boleta de agua de ${formatearPeriodo(boleta.periodo)} está lista:`,
  ];
  if (boleta.consumoM3 !== null) lineas.push(`• Consumo: ${boleta.consumoM3} m³`);
  lineas.push(`• Monto: ${clp.format(boleta.montoTotal)}`);
  if (abonada) lineas.push(`• Te quedan por pagar: ${clp.format(porPagar)}`);
  lineas.push(`• Vence el ${diaMes.format(boleta.fechaVencimiento)}`);

  if (comite.infoPago?.trim()) {
    lineas.push("", `Cómo pagar: ${comite.infoPago.trim()}`);
  }
  lineas.push(
    "",
    "Cuando pagues, envíanos el comprobante por este mismo WhatsApp y lo registramos."
  );
  if (comite.slug) {
    lineas.push(
      "",
      `Revisa tu cuenta cuando quieras: https://${comite.slug}.${DOMINIO_RAIZ}/socio/entrar`
    );
  }

  return lineas.join("\n");
}
