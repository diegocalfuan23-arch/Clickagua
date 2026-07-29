"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatearPeriodo } from "@/lib/boletas";
import { cn } from "@/lib/utils";

export type BoletaReciente = {
  id: string;
  socioNombre: string;
  periodo: string;
  montoTotal: number;
  montoPagado: number;
  fechaVencimiento: Date;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fechaCorta = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
});

export function BoletasRecientes({ boletas }: { boletas: BoletaReciente[] }) {
  const [busqueda, setBusqueda] = useState("");

  // La fecha se lee una vez al montar: leerla en cada render haría que el
  // estado de una boleta cambiara sola mientras se mira la pantalla.
  const [ahora] = useState(() => new Date());

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return boletas;

    return boletas.filter((b) =>
      `${b.socioNombre} ${formatearPeriodo(b.periodo)}`
        .toLowerCase()
        .includes(termino)
    );
  }, [boletas, busqueda]);

  if (boletas.length === 0) {
    return (
      <p className="mt-8 mb-4 text-center text-[0.88rem] text-muted-foreground">
        Todavía no hay boletas emitidas.
      </p>
    );
  }

  return (
    <>
      <div className="relative mt-4 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar socio o período…"
          aria-label="Buscar en boletas recientes"
          className="h-9 border-transparent bg-muted/60 pl-9"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[0.87rem]">
          <thead>
            <tr className="border-b border-border/50 text-left text-muted-foreground">
              <th className="pb-2.5 font-medium">Socio</th>
              <th className="pb-2.5 font-medium">Período</th>
              <th className="pb-2.5 font-medium">Monto</th>
              <th className="pb-2.5 font-medium">Vence</th>
              <th className="pb-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Ninguna boleta coincide con «{busqueda}».
                </td>
              </tr>
            ) : (
              filtradas.map((b) => {
                const pagada = b.montoPagado >= b.montoTotal;
                const atrasada = !pagada && b.fechaVencimiento < ahora;

                return (
                  <tr
                    key={b.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-3 font-medium">{b.socioNombre}</td>
                    <td className="py-3 text-muted-foreground">
                      {formatearPeriodo(b.periodo)}
                    </td>
                    <td className="py-3 tabular-nums">
                      {clp.format(b.montoTotal)}
                    </td>
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {fechaCorta.format(b.fechaVencimiento)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                          pagada
                            ? "bg-forest/10 text-forest"
                            : atrasada
                              ? "bg-destructive/10 text-destructive"
                              : "bg-tertiary/15 text-tertiary-texto"
                        )}
                      >
                        {pagada ? "Pagada" : atrasada ? "Vencida" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
