/**
 * Convierte +56912345678 en "+56 9 1234 5678". La base de datos guarda el
 * número en E.164 porque es el formato en que llega desde WhatsApp; esto es
 * solo para mostrarlo legible en el panel.
 */
export function formatearTelefono(telefono: string) {
  const chileno = telefono.match(/^\+56(9)(\d{4})(\d{4})$/);
  if (chileno) {
    const [, movil, primera, segunda] = chileno;
    return `+56 ${movil} ${primera} ${segunda}`;
  }
  return telefono;
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
