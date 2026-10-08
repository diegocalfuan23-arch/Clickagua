/**
 * Sugerencia de contraseña segura. Se genera con el generador criptográfico del
 * navegador (no con Math.random) y evita los caracteres que se confunden al
 * leerlos o dictarlos: sin 0/O, 1/l/I. Sale en grupos con guion para poder
 * copiarla o leerla: kP7m-Tq9x-Wd4n-Rv2z (16 caracteres al azar, ~90 bits).
 */
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITOS = "23456789";
const ALFABETO = MINUSCULAS + MAYUSCULAS + DIGITOS;

/** Un índice al azar sin sesgo: se descartan los bytes que no dividen parejo. */
function indiceAlAzar(largo: number) {
  const limite = 256 - (256 % largo);
  const byte = new Uint8Array(1);
  do {
    crypto.getRandomValues(byte);
  } while (byte[0] >= limite);
  return byte[0] % largo;
}

export function generarClave(grupos = 4, largoGrupo = 4) {
  const total = grupos * largoGrupo;

  for (;;) {
    const caracteres = Array.from(
      { length: total },
      () => ALFABETO[indiceAlAzar(ALFABETO.length)]
    ).join("");

    // Que tenga de las tres clases, para pasar cualquier regla de contraseña.
    if (
      /[a-z]/.test(caracteres) &&
      /[A-Z]/.test(caracteres) &&
      /[2-9]/.test(caracteres)
    ) {
      return caracteres.match(new RegExp(`.{${largoGrupo}}`, "g"))!.join("-");
    }
  }
}
