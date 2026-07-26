import { Check, Droplet, MapPin } from "lucide-react";

// Patrón fijo (no aleatorio) para simular un código de barras sin desajustes de hidratación SSR.
const barcodeWidths = [
  2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2,
  1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 1, 1, 3,
];

const puntos = [
  {
    titulo: "Consumo, cargo fijo y variable",
    detalle:
      "Desglosados igual que en la boleta impresa, para que el socio entienda de dónde sale el total.",
  },
  {
    titulo: "Historial de boletas pendientes",
    detalle:
      "Si hay más de un mes impago, ClickAgua lo suma y lo explica sin que el socio tenga que preguntar dos veces.",
  },
  {
    titulo: "Identificación por teléfono o RUT",
    detalle:
      "Si el número no está registrado, el bot pide el RUT antes de mostrar cualquier dato — nunca expone información a quien no corresponde.",
  },
];

export function InvoiceSection() {
  return (
    <section id="boleta" className="border-y border-border bg-muted/40 py-23">
      <div className="mx-auto grid max-w-[1180px] gap-15 px-7 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="bg-foreground px-5.5 py-4.5 text-background">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary">
                  <Droplet className="size-3.5 fill-white text-white" />
                </span>
                <span className="font-display text-[0.98rem] font-semibold">
                  APR Pitrelahué
                </span>
              </div>
              <span className="rounded-full bg-secondary/90 px-2.5 py-1 font-mono text-[0.68rem] font-bold tracking-[0.05em] uppercase">
                Pendiente
              </span>
            </div>
            <div className="mt-3.5 font-mono text-[0.72rem] font-semibold tracking-[0.09em] opacity-70 uppercase">
              Boleta N.º 004821 · Período junio 2026
            </div>
            <div className="mt-1 font-display text-[1.1rem]">
              María Huenchuñir
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] opacity-75">
              <MapPin className="size-3.5 shrink-0" />
              Camino Real 1420, Pitrelahué
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-b border-border px-5.5 py-4.5 text-[0.82rem]">
            <div>
              <div className="text-muted-foreground">N.º de cliente</div>
              <div className="font-semibold tabular-nums">00184-2</div>
            </div>
            <div>
              <div className="text-muted-foreground">N.º de medidor</div>
              <div className="font-semibold tabular-nums">MD-77341</div>
            </div>
            <div>
              <div className="text-muted-foreground">Lectura anterior</div>
              <div className="font-semibold tabular-nums">842 m³</div>
            </div>
            <div>
              <div className="text-muted-foreground">Lectura actual</div>
              <div className="font-semibold tabular-nums">856 m³</div>
            </div>
            <div>
              <div className="text-muted-foreground">Fecha de emisión</div>
              <div className="font-semibold tabular-nums">01/07/2026</div>
            </div>
            <div>
              <div className="text-muted-foreground">Fecha de vencimiento</div>
              <div className="font-semibold tabular-nums text-secondary">
                30/07/2026
              </div>
            </div>
          </div>

          <div className="p-5.5">
            <div className="flex justify-between border-b border-dashed border-border py-3 text-[0.92rem]">
              <span className="text-muted-foreground">Consumo (14 m³)</span>
              <span className="font-semibold tabular-nums">$6.350</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-border py-3 text-[0.92rem]">
              <span className="text-muted-foreground">Cargo fijo</span>
              <span className="font-semibold tabular-nums">$2.100</span>
            </div>
            <div className="flex justify-between py-3 text-[0.92rem]">
              <span className="text-muted-foreground">Reposición de subsidio</span>
              <span className="font-semibold tabular-nums">$0</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-foreground pt-4">
              <span>Total a pagar</span>
              <span className="font-mono text-[1.6rem] font-bold tabular-nums text-primary">
                $8.450
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/50 px-5.5 py-4">
            <div className="flex h-8 items-end gap-[2px]" aria-hidden>
              {barcodeWidths.map((w, i) => (
                <span
                  key={i}
                  className="bg-foreground"
                  style={{ width: `${w}px`, height: "100%" }}
                />
              ))}
            </div>
            <span className="font-mono text-[0.68rem] text-muted-foreground">
              00184268450300726
            </span>
          </div>
        </div>

        <div>
          <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
            La misma boleta, sin la espera
          </span>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,2.8vw,2.2rem)] font-semibold text-balance">
            Lo que hoy vive en una planilla, ahora cabe en un mensaje.
          </h2>
          <ul className="mt-6.5 flex flex-col gap-4">
            {puntos.map(({ titulo, detalle }) => (
              <li key={titulo} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <strong className="mb-0.5 block">{titulo}</strong>
                  <span className="text-[0.9rem] text-muted-foreground">
                    {detalle}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
