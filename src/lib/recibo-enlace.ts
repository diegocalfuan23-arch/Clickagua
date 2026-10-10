import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Enlace al recibo en PDF que va dentro del mensaje de WhatsApp. WhatsApp no
 * permite adjuntar un archivo desde un enlace (wa.me solo lleva texto), así que
 * el mensaje lleva este enlace y quien lo recibe toca para abrir o descargar el
 * PDF.
 *
 * El enlace va firmado (HMAC) con el id de la boleta, así que no necesita una
 * columna en la base y no se puede adivinar el de otra boleta cambiando el id.
 * Quien reciba el enlace puede abrirlo sin iniciar sesión: es como un recibo en
 * papel, solo lo ve quien lo recibe.
 */

const LARGO_FIRMA = 22;

function firma(boletaId: string) {
  const secreto = process.env.BETTER_AUTH_SECRET;
  if (!secreto) throw new Error("Falta BETTER_AUTH_SECRET.");
  return createHmac("sha256", secreto)
    .update(`recibo:${boletaId}`)
    .digest("base64url")
    .slice(0, LARGO_FIRMA);
}

export function codigoRecibo(boletaId: string) {
  return `${boletaId}.${firma(boletaId)}`;
}

/** El id de la boleta si el código es auténtico; null si fue alterado. */
export function boletaIdDeCodigo(codigo: string): string | null {
  const punto = codigo.lastIndexOf(".");
  if (punto <= 0) return null;

  const id = codigo.slice(0, punto);
  const recibida = Buffer.from(codigo.slice(punto + 1));
  const esperada = Buffer.from(firma(id));

  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
    ? id
    : null;
}

export function urlRecibo(boletaId: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    "https://facilapr.cl";
  return `${base.replace(/\/$/, "")}/r/${codigoRecibo(boletaId)}`;
}
