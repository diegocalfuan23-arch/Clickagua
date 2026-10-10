import type { Metadata } from "next";
import { requireAdmin } from "@/lib/apr-session";
import { AyudaRecorridos } from "@/components/panel/ayuda-recorridos";

export const metadata: Metadata = {
  title: "Ayuda",
};

export default async function AyudaPanelPage() {
  await requireAdmin();
  return <AyudaRecorridos />;
}
