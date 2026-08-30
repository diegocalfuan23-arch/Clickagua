"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/apr-session";
import {
  aprobarSolicitudAcceso,
  rechazarSolicitudAcceso,
  type ResultadoAprobacion,
} from "@/lib/socios-acceso";

export async function aprobarSolicitud(
  solicitudId: string
): Promise<ResultadoAprobacion> {
  const { apr } = await requireAdmin();

  const resultado = await aprobarSolicitudAcceso(solicitudId, apr.id);

  if (resultado.ok) {
    revalidatePath("/panel/socios/solicitudes");
    revalidatePath("/panel");
  }

  return resultado;
}

export async function rechazarSolicitud(
  solicitudId: string,
  motivo: string
): Promise<ResultadoAprobacion> {
  const { apr } = await requireAdmin();

  const resultado = await rechazarSolicitudAcceso(solicitudId, apr.id, motivo);

  if (resultado.ok) {
    revalidatePath("/panel/socios/solicitudes");
    revalidatePath("/panel");
  }

  return resultado;
}
