import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";

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

  if (!session || session.user.rol !== "SOCIO") {
    redirect(`/socio/entrar`);
  }

  const socio = await db.query.socios.findFirst({
    where: eq(socios.userId, session.user.id),
    with: { apr: true },
  });

  if (!socio || socio.apr.slug !== slugEsperado) {
    redirect(`/socio/entrar`);
  }

  return { user: session.user, socio };
}
