import { extractText, getDocumentProxy } from "unpdf";
import type { ResultadoTabla } from "@/lib/tabla";

/**
 * Lee la lista de socios de un PDF CON TEXTO (el que sale de Excel o de un
 * sistema: se puede seleccionar el texto). Un PDF escaneado o una foto no
 * tiene texto y no se puede leer aquí.
 *
 * El PDF no guarda "celdas", solo líneas de texto, así que cada línea se
 * interpreta con reglas: [N.º] nombre RUT [teléfono]. Es de mejor esfuerzo; por
 * eso el resultado siempre pasa por la pantalla de revisión antes de cargarse.
 */

const RUT =
  /\b\d{1,2}(?:\.\d{3}){2}-[\dkK]\b|\b\d{6,8}-[\dkK]\b/;
const TELEFONO = /(?:\+?56[\s-]?)?9[\s-]?\d{4}[\s-]?\d{4}/;

export async function leerPdf(contenido: Uint8Array): Promise<ResultadoTabla> {
  let texto: string;
  try {
    const pdf = await getDocumentProxy(contenido);
    ({ text: texto } = await extractText(pdf, { mergePages: true }));
  } catch {
    return {
      ok: false,
      error:
        "No pudimos leer el PDF. Prueba con el archivo de Excel, o con un PDF que no esté protegido.",
    };
  }

  if (texto.replace(/\s/g, "").length < 20) {
    return {
      ok: false,
      error:
        "Este PDF no tiene texto: parece un escaneo o una foto. Pídele a quien lo hizo el Excel original, o prueba con un PDF exportado desde Excel.",
    };
  }

  const filas: string[][] = [["numeroCliente", "nombre", "rut", "telefono"]];

  for (const linea of texto.split(/\r?\n/)) {
    let resto = linea.replace(/\s+/g, " ").trim();
    if (!resto) continue;

    const inicio = resto.match(/^(\d{1,4})[.)]?\s+(.*)$/);
    const numero = inicio ? inicio[1] : "";
    if (inicio) resto = inicio[2];

    const rut = RUT.exec(resto);
    if (rut) {
      const nombre = resto.slice(0, rut.index).trim();
      // Lo que sigue al RUT puede ser el teléfono o una segunda tabla al lado;
      // solo rescatamos un teléfono, lo demás se ignora.
      const despues = resto.slice(rut.index + rut[0].length);
      filas.push([numero, nombre, rut[0], TELEFONO.exec(despues)?.[0].trim() ?? ""]);
      continue;
    }

    // Línea numerada sin RUT: un socio al que le falta. Si hay una segunda tabla
    // al lado, vuelve a empezar con el mismo número: ahí se corta.
    if (inicio) {
      let nombre = resto;
      const corte = new RegExp(`\\s${numero}\\s`).exec(` ${resto} `);
      if (corte && corte.index > 0) nombre = resto.slice(0, corte.index - 1).trim();
      // Descarta restos que no son nombres (números de página, "1 / 2").
      if (/[a-záéíóúñ]{2,}/i.test(nombre)) filas.push([numero, nombre, "", ""]);
    }
  }

  if (filas.length < 2) {
    return {
      ok: false,
      error:
        "Leí el PDF, pero no encontré líneas con un nombre y un RUT. Prueba con el archivo de Excel.",
    };
  }

  return { ok: true, filas };
}
