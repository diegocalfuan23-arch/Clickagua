import { readSheet } from "read-excel-file/node";

/**
 * Lee una planilla subida por el comité (CSV o Excel .xlsx) y la devuelve como
 * filas de texto, para que los importadores no distingan el formato. La
 * primera fila es el encabezado.
 */
export type ResultadoTabla =
  | { ok: true; filas: string[][] }
  | { ok: false; error: string };

/** Divide una línea de CSV respetando comillas. Acepta coma o punto y coma. */
function partirLinea(linea: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if ((c === "," || c === ";") && !entreComillas) {
      campos.push(actual.trim());
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual.trim());
  return campos;
}

/**
 * Una celda de Excel a texto. Las fechas salen como AAAA-MM-DD (en UTC: así el
 * día no se corre por la zona horaria) y los números como enteros, porque aquí
 * todo es CLP, m³ o RUT sin decimales; "1250.0" se leería como 12500 al quitar
 * el punto.
 */
function celdaATexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  if (typeof valor === "number") {
    return Number.isInteger(valor) ? String(valor) : String(Math.round(valor));
  }
  return String(valor).trim();
}

export async function leerTabla(archivo: File): Promise<ResultadoTabla> {
  const nombre = archivo.name.toLowerCase();

  let filas: string[][];

  if (nombre.endsWith(".xlsx")) {
    try {
      // Solo la primera hoja: es la que el comité arma como planilla.
      const hoja = await readSheet(Buffer.from(await archivo.arrayBuffer()));
      filas = hoja.map((fila) => fila.map(celdaATexto));
    } catch {
      return {
        ok: false,
        error:
          "No pudimos leer el archivo de Excel. Revisa que sea un .xlsx válido, o guárdalo como CSV.",
      };
    }
  } else if (nombre.endsWith(".xls")) {
    return {
      ok: false,
      error:
        "El formato .xls antiguo no se puede leer. En Excel usa Guardar como y elige .xlsx o CSV.",
    };
  } else {
    const texto = await archivo.text();
    filas = texto
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "")
      .map(partirLinea);
  }

  // Excel suele arrastrar filas vacías al final de la hoja.
  filas = filas.filter((fila) => fila.some((celda) => celda !== ""));

  if (filas.length < 2) {
    return { ok: false, error: "El archivo no tiene filas de datos." };
  }

  return { ok: true, filas };
}
