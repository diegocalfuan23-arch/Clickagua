/**
 * Convierte +56912345678 en "+56 9 1234 5678". La base de datos guarda el
 * número en E.164; esto es solo para mostrarlo legible en el panel.
 */
export function formatearTelefono(telefono: string) {
  const chileno = telefono.match(/^\+56(9)(\d{4})(\d{4})$/);
  if (chileno) {
    const [, movil, primera, segunda] = chileno;
    return `+56 ${movil} ${primera} ${segunda}`;
  }
  return telefono;
}

/** "hace 5 min", "hace 3 h", "hace 2 días" — para listados recientes. */
export function tiempoRelativo(fecha: Date) {
  const segundos = Math.max(0, (Date.now() - fecha.getTime()) / 1000);

  if (segundos < 60) return "hace instantes";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

/**
 * Normaliza el RUT a 12345678-9: sin puntos, dígito verificador en
 * mayúscula. Es la forma en que se guarda y compara en toda la base.
 */
export function normalizarRut(valor: string) {
  // También se quitan comas: en planillas aparece "3.435,146-5" por error de tipeo.
  const limpio = valor.replace(/[.,\s]/g, "").toUpperCase();
  return limpio.includes("-")
    ? limpio
    : limpio.replace(/^(\d+)([\dK])$/, "$1-$2");
}

/** Deja el teléfono en formato E.164 (+56...) para guardarlo consistente. */
export function normalizarTelefono(valor: string) {
  const digitos = valor.replace(/[^\d]/g, "");

  if (valor.trim().startsWith("+")) return `+${digitos}`;
  if (digitos.startsWith("56")) return `+${digitos}`;
  // Un número chileno sin prefijo: 9 1234 5678
  if (digitos.length === 9) return `+56${digitos}`;

  return `+${digitos}`;
}

/** ¿El dígito verificador calza con el cuerpo? (módulo 11). Solo orienta: no bloquea. */
export function rutValido(valor: string) {
  const partes = normalizarRut(valor).match(/^(\d{6,8})-([\dK])$/);
  if (!partes) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = partes[1].length - 1; i >= 0; i--) {
    suma += Number(partes[1][i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === partes[2];
}

/** Agrupa el RUT con puntos: 12345678-9 → 12.345.678-9 */
export function formatearRut(rut: string | null | undefined) {
  // Un usuario (no socio) puede no tener RUT.
  if (!rut) return "—";
  const partes = rut.split("-");
  if (partes.length !== 2) return rut;

  const [cuerpo, dv] = partes;
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

/** Iniciales para el avatar: "María Huenchuñir" → "MH" */
export function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? "")
    .join("");
}
