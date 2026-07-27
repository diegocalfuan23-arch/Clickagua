import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aprs } from "@/lib/db/schema";
import { user as userTable } from "@/lib/db/auth-schema";

/**
 * Devuelve la sesión y el APR al que pertenece el usuario. Redirige a /login
 * si no hay sesión, de modo que toda página del panel quede protegida.
 *
 * Cada consulta del panel debe filtrar por el `aprId` que devuelve esta
 * función: es lo que impide que un comité vea los datos de otro.
 */
export async function requireApr() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.aprId) {
    const apr = await db.query.aprs.findFirst({
      where: eq(aprs.id, user.aprId),
    });

    if (apr) {
      return { user, apr };
    }
  }

  // Usuarios creados antes de que existiera la tabla Apr: los vinculamos
  // ahora usando los datos que declararon al registrarse.
  const existente = await db.query.aprs.findFirst({
    where: eq(aprs.rut, user.rutComite),
  });

  const apr =
    existente ??
    (
      await db
        .insert(aprs)
        .values({
          nombre: user.apr,
          rut: user.rutComite,
          comuna: user.comuna,
        })
        .returning()
    )[0];

  await db
    .update(userTable)
    .set({ aprId: apr.id })
    .where(eq(userTable.id, user.id));

  return { user, apr };
}
