import { Check } from "lucide-react";

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
          <div className="flex items-baseline justify-between bg-foreground px-5.5 py-4.5 text-background">
            <div>
              <div className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] opacity-75 uppercase">
                Boleta · junio 2026
              </div>
              <div className="mt-1 font-display text-[1.05rem]">
                María Huenchuñir
              </div>
            </div>
            <div className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] opacity-75 uppercase">
              Pendiente
            </div>
          </div>
          <div className="p-5.5">
            <div className="flex justify-between border-b border-dashed border-border py-3 text-[0.92rem]">
              <span className="text-muted-foreground">Consumo</span>
              <span className="font-semibold tabular-nums">14 m³</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-border py-3 text-[0.92rem]">
              <span className="text-muted-foreground">Cargo fijo</span>
              <span className="font-semibold tabular-nums">$2.100</span>
            </div>
            <div className="flex justify-between py-3 text-[0.92rem]">
              <span className="text-muted-foreground">Cargo variable</span>
              <span className="font-semibold tabular-nums">$6.350</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-foreground pt-4">
              <span>Total a pagar</span>
              <span className="font-mono text-[1.6rem] font-bold tabular-nums text-primary">
                $8.450
              </span>
            </div>
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
