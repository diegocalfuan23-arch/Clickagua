/**
 * Plazos de conservación de datos que promete la política de privacidad.
 *
 * Vive aparte de las server actions porque un módulo "use server" solo
 * puede exportar funciones asíncronas: una constante ahí rompe el build.
 */

/**
 * Días entre que un comité solicita cerrar su cuenta y el borrado
 * definitivo de sus datos. Durante ese plazo puede arrepentirse.
 *
 * Si se cambia, hay que actualizar también /privacidad, que declara este
 * mismo número ante los titulares.
 */
export const DIAS_HASTA_BORRADO = 90;
