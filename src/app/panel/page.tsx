import type { Metadata } from "next";
import { requireApr } from "@/lib/apr-session";

export const metadata: Metadata = {
  title: "Resumen",
};

export default async function PanelPage() {
  // Sigue protegiendo la ruta aunque no se muestre nada todavía.
  await requireApr();

  // Dashboard vaciado a propósito: los KPI se definen de nuevo, uno por uno.
  return null;
}
