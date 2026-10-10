import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { basePortal } from "@/lib/portal-socio";

/**
 * Sesión de un socio dentro de SU panel (rol SOCIO). Un ADMIN u OPERADOR que
 * llegue aquí queda igual bloqueado: ese rol usa requireApr()/requireAdmin(),
 * no esta función — son paneles completamente distintos.
 *
 * `slugEsperado` viene del subdominio (ver src/proxy.ts): un socio de
 * pitrelahue no puede usar su sesión para entrar al panel de otro comité
 * aunque de alguna forma consiguiera la cookie.
 */
export async function requireSocio(slugEsperado: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const base = await basePortal(slugEsperado);

  if (!session || session.user.rol !== "SOCIO") {
    redirect(`${base}/entrar`);
  }

  const socio = await db.query.socios.findFirst({
    where: eq(socios.userId, session.user.id),
    with: { apr: true },
  });

  if (!socio || socio.apr.slug !== slugEsperado) {
    redirect(`${base}/entrar`);
  }

  return { user: session.user, socio };
}

/**
 * Todas las cuentas (arranques) de la misma persona dentro del comité: las que
 * comparten su RUT. Quien tiene dos medidores entra una sola vez y ve las
 * boletas de los dos. Sin RUT, solo la suya.
 */
export async function cuentasDelSocio(socio: {
  id: string;
  nombre: string;
  aprId: string;
  rut: string | null;
}) {
  if (!socio.rut) return [{ id: socio.id, nombre: socio.nombre }];

  return db.query.socios.findMany({
    where: and(eq(socios.aprId, socio.aprId), eq(socios.rut, socio.rut)),
    columns: { id: true, nombre: true },
  });
}
