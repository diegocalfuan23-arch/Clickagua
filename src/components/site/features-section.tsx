import { Smartphone, Building2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const caracteristicas = [
  {
    icon: Smartphone,
    titulo: "Panel para cada socio",
    detalle:
      "Cada socio entra con su RUT y clave a ver su propia deuda, boletas y consumo. Sin llamar, sin esperar respuesta.",
    tono: "bg-primary/12 text-primary",
  },
  {
    icon: Building2,
    titulo: "Menos filas en oficina",
    detalle:
      'Las preguntas de "cuánto debo" que hoy ocupan a tu personal, se resuelven solas antes de que el socio llegue a la puerta.',
    tono: "bg-secondary/12 text-secondary",
  },
  {
    icon: ShieldCheck,
    titulo: "Datos que no se inventan",
    detalle:
      "Cada respuesta se calcula desde tu propio registro de boletas — nunca un monto aproximado ni una respuesta genérica.",
    tono: "bg-tertiary/20 text-tertiary-foreground",
  },
];

export function FeaturesSection() {
  return (
    <section id="caracteristicas" className="py-23">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mb-13 max-w-[640px]">
          <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
            Por qué un APR elegiría esto
          </span>
          <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)] font-semibold text-balance">
            Pensado para la realidad de un comité rural
          </h2>
        </div>

        <div className="grid gap-5.5 sm:grid-cols-3">
          {caracteristicas.map(({ icon: Icon, titulo, detalle, tono }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-border bg-card p-6.5"
            >
              <div
                className={cn(
                  "mb-4.5 flex size-10 items-center justify-center rounded-[10px]",
                  tono
                )}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="mb-2 text-[1.05rem] font-semibold">{titulo}</h3>
              <p className="text-[0.91rem] leading-relaxed text-muted-foreground">
                {detalle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
