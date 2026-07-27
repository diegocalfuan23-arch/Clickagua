import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import { NuevoSocioDialog } from "@/components/panel/nuevo-socio-dialog";
import { SocioRowActions } from "@/components/panel/socio-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Socios",
};

export default async function SociosPage() {
  const { apr } = await requireApr();

  const listado = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [asc(socios.nombre)],
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] font-semibold tracking-tight">Socios</h1>
          <p className="mt-1 text-[0.93rem] text-muted-foreground">
            {listado.length === 0
              ? "Aún no has cargado socios."
              : `${listado.length} ${listado.length === 1 ? "socio registrado" : "socios registrados"}.`}
          </p>
        </div>
        <NuevoSocioDialog />
      </div>

      {listado.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-[1rem] font-semibold">
            Carga a tu primer socio
          </h2>
          <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted-foreground">
            El bot de WhatsApp responde solo a los socios que estén registrados
            aquí, identificándolos por su teléfono o RUT.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listado.map((socio) => (
                <TableRow key={socio.id}>
                  <TableCell className="font-medium">{socio.nombre}</TableCell>
                  <TableCell className="tabular-nums">{socio.rut}</TableCell>
                  <TableCell className="tabular-nums">
                    {socio.telefono}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {socio.direccion ?? "—"}
                  </TableCell>
                  <TableCell>
                    <SocioRowActions socioId={socio.id} nombre={socio.nombre} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
