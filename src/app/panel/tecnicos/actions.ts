"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitaciones } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** Cancela una invitación sin usar antes de que venza, para que el código quede inválido. */
export async function cancelarInvitacion(
  invitacionId: string
): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  await db
    .delete(invitaciones)
    .where(
      and(eq(invitaciones.id, invitacionId), eq(invitaciones.aprId, apr.id))
    );

  revalidatePath("/panel/tecnicos");
  return { ok: true };
}
