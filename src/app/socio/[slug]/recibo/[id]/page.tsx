import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cuentasDelSocio, requireSocio } from "@/lib/socio-session";
import { reciboDeSocio } from "@/lib/recibo";
import { Recibo } from "@/components/recibos/recibo";
import { ImprimirBoton } from "@/components/recibos/imprimir-boton";
import { basePortal } from "@/lib/portal-socio";

type Props = { params: Promise<{ slug: string; id: string }> };

export const metadata: Metadata = {
  title: "Mi recibo",
  robots: { index: false, follow: false },
};

export default async function ReciboSocioPage({ params }: Props) {
  const { slug, id } = await params;
  const { socio } = await requireSocio(slug);
  const base = await basePortal(slug);

  // El filtro por socio impide abrir el recibo de otra persona cambiando el id.
  const cuentas = await cuentasDelSocio(socio);
  const recibo = await reciboDeSocio(
    cuentas.map((c) => c.id),
    id
  );
  if (!recibo) notFound();

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={base}
          className="text-[0.9rem] text-muted-foreground hover:underline"
        >
          ← Mi cuenta
        </Link>
        <ImprimirBoton />
      </div>
      <Recibo r={recibo} />
    </div>
  );
}
