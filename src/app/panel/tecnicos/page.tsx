import type { Metadata } from "next";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitaciones } from "@/lib/db/schema";
import { user as userTable } from "@/lib/db/auth-schema";
import { requireAdmin } from "@/lib/apr-session";
import { TecnicosPanel } from "@/components/panel/tecnicos-panel";

export const metadata: Metadata = {
  title: "Técnicos",
};

export default async function TecnicosPage() {
  const { apr } = await requireAdmin();

  const tecnicos = await db.query.user.findMany({
    where: and(eq(userTable.aprId, apr.id), eq(userTable.rol, "OPERADOR")),
    orderBy: [desc(userTable.createdAt)],
    columns: { id: true, name: true, email: true, createdAt: true },
  });

  const pendientes = await db.query.invitaciones.findMany({
    where: and(
      eq(invitaciones.aprId, apr.id),
      eq(invitaciones.rol, "OPERADOR"),
      isNull(invitaciones.usadaPor),
      gt(invitaciones.expiraEn, new Date())
    ),
    orderBy: [desc(invitaciones.createdAt)],
    columns: { id: true, codigo: true, expiraEn: true, createdAt: true },
  });

  return (
    <TecnicosPanel
      tecnicos={tecnicos.map((t) => ({
        id: t.id,
        nombre: t.name,
        correo: t.email,
        desde: t.createdAt,
      }))}
      invitacionesPendientes={pendientes.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        expiraEn: i.expiraEn,
        creadaEn: i.createdAt,
      }))}
    />
  );
}
