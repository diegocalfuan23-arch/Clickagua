import type { Metadata } from "next";
import { headers } from "next/headers";
import { Users, ReceiptText, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Resumen — ClickAgua",
};

const metricas = [
  { label: "Socios registrados", valor: "0", icon: Users },
  { label: "Boletas pendientes", valor: "0", icon: ReceiptText },
  { label: "Consultas este mes", valor: "0", icon: MessageSquare },
];

export default async function PanelPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <>
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight">
          Hola, {session?.user.name}
        </h1>
        <p className="mt-1 text-[0.93rem] text-muted-foreground">
          Este es el resumen de tu comité.
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

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-[1rem] font-semibold">
          Aún no hay socios cargados
        </h2>
        <p className="mt-2 max-w-[56ch] text-[0.92rem] leading-relaxed text-muted-foreground">
          Cuando cargues a los socios de tu comité, aparecerán aquí junto a sus
          boletas y el estado de sus consultas por WhatsApp.
        </p>
      </div>
    </>
  );
}
