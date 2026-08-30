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
  const limpio = valor.replace(/[.\s]/g, "").toUpperCase();
  return limpio.includes("-")
    ? limpio
    : limpio.replace(/^(\d+)([\dK])$/, "$1-$2");
}

/** Agrupa el RUT con puntos: 12345678-9 → 12.345.678-9 */
export function formatearRut(rut: string) {
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
