import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { Users, ReceiptText, MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { socios, boletas } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";

export const metadata: Metadata = {
  title: "Resumen",
};

export default async function PanelPage() {
  const { user, apr } = await requireApr();

  const [{ total: totalSocios }] = await db
    .select({ total: count() })
    .from(socios)
    .where(eq(socios.aprId, apr.id));

  const [{ total: boletasPendientes }] = await db
    .select({ total: count() })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(and(eq(socios.aprId, apr.id), eq(boletas.estado, "PENDIENTE")));

  const metricas = [
    { label: "Socios registrados", valor: totalSocios, icon: Users },
    { label: "Boletas pendientes", valor: boletasPendientes, icon: ReceiptText },
    { label: "Consultas este mes", valor: 0, icon: MessageSquare },
  ];

  return (
    <>
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight">
          Hola, {user.name}
        </h1>
        <p className="mt-1 text-[0.93rem] text-muted-foreground">
          Este es el resumen de {apr.nombre}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metricas.map(({ label, valor, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.85rem] text-muted-foreground">
                {label}
              </span>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-[1.75rem] font-semibold tabular-nums">
              {valor}
            </div>
          </div>
        ))}
      </div>

      {totalSocios === 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[1rem] font-semibold">
            Empieza cargando a tus socios
          </h2>
          <p className="mt-2 max-w-[56ch] text-[0.92rem] leading-relaxed text-muted-foreground">
            El bot de WhatsApp responde solo a socios registrados. Una vez
            cargados, podrás emitir sus boletas y ellos podrán consultar su
            deuda por WhatsApp.
          </p>
          <Link
            href="/panel/socios"
            className="mt-4 inline-block text-[0.92rem] font-medium text-primary hover:underline"
          >
            Ir a socios →
          </Link>
        </div>
      )}
    </>
  );
}
