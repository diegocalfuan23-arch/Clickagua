import type { Metadata } from "next";
import { requireApr } from "@/lib/apr-session";

export const metadata: Metadata = {
  title: "Resumen",
};

export default async function PanelPage() {
  const { user, apr } = await requireApr();

  return (
    <>
      <div>
        <h1 className="text-[1.35rem] font-semibold tracking-tight">
          Hola, {user.name}
        </h1>
        <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
          {apr.nombre} · {apr.comuna}
        </p>
      </div>

      {/* Dashboard vaciado a propósito: los KPI se definen de nuevo, uno por
          uno, en vez de heredar los que había. */}
    </>
  );
}
