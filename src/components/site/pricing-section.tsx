import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const planes = [
  {
    nombre: "Comité Pequeño",
    descripcion: "Para APR con hasta 200 socios.",
    precio: "0,7 UF",
    periodo: "/mes",
    iva: true,
    lista: [
      "300 respuestas de WhatsApp al mes",
      "Hasta 200 socios cargados",
      "Panel de administración",
      "Soporte por WhatsApp",
    ],
    cta: "Elegir plan",
    destacado: false,
  },
  {
    nombre: "Comité Estándar",
    descripcion: "Para APR con hasta 800 socios.",
    precio: "1,5 UF",
    periodo: "/mes",
    iva: true,
    lista: [
      "1.200 respuestas de WhatsApp al mes",
      "Hasta 800 socios cargados",
      "Importación de boletas por CSV",
      "Soporte prioritario",
    ],
    cta: "Elegir plan",
    destacado: true,
  },
  {
    nombre: "APR Grande",
    descripcion: "Más de 800 socios o varias sedes.",
    precio: "A medida",
    periodo: null,
    iva: false,
    lista: [
      "Respuestas de WhatsApp a medida",
      "Socios ilimitados",
      "Múltiples sedes o comités",
      "Acompañamiento en la puesta en marcha",
    ],
    cta: "Conversemos",
    destacado: false,
  },
];

const addOnes = [
  {
    nombre: "+300 respuestas",
    precio: "0,25 UF",
    periodo: "/mes",
  },
  {
    nombre: "+1.000 respuestas",
    precio: "0,7 UF",
    periodo: "/mes",
  },
];

export function PricingSection() {
  return (
    <section id="planes" className="py-23">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mx-auto mb-13 max-w-[640px] text-center">
          <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
            Planes
          </span>
          <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)] font-semibold text-balance">
            Un precio que crece con tu comité
          </h2>
          <p className="mt-3.5 text-[1.05rem] leading-relaxed text-muted-foreground">
            Según la cantidad de socios activos que administra tu APR o SSR.
            Sin contratos de permanencia.
          </p>
        </div>

        <div className="grid items-stretch gap-5.5 sm:grid-cols-3">
          {planes.map((plan) => (
            <div
              key={plan.nombre}
              className={cn(
                "relative flex flex-col rounded-2xl border border-border bg-card p-7.5",
                plan.destacado && "border-primary shadow-[0_0_0_1px_var(--primary)]"
              )}
            >
              {plan.destacado && (
                <span className="absolute -top-3.25 left-6.5 rounded-full bg-primary px-3 py-1.25 text-[0.72rem] font-bold tracking-[0.03em] text-primary-foreground">
                  Más elegido
                </span>
              )}

              <span className="text-[1.15rem] font-semibold">
                {plan.nombre}
              </span>
              <p className="mt-1.5 mb-5 text-[0.88rem] text-muted-foreground">
                {plan.descripcion}
              </p>

              <div className="flex items-baseline gap-1.5 text-[2rem] font-semibold">
                {plan.precio}
                {plan.periodo && (
                  <span className="font-sans text-[0.9rem] font-medium text-muted-foreground">
                    {plan.periodo}
                  </span>
                )}
              </div>
              {plan.iva && (
                <p className="mb-5 text-[0.8rem] text-muted-foreground">
                  + IVA
                </p>
              )}
              {!plan.iva && <div className="mb-5" />}

              <ul className="mb-6.5 flex flex-1 flex-col gap-3">
                {plan.lista.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[0.9rem] text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className={cn(
                  buttonVariants({
                    variant: plan.destacado ? "default" : "outline",
                  }),
                  "w-full"
                )}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-[640px] text-center text-[0.85rem] text-muted-foreground">
          El bot de WhatsApp necesita un número exclusivo para el comité (no
          puede ser el celular personal de alguien de la directiva). Un chip
          nuevo sirve.
        </p>

        <div className="mx-auto mt-13 max-w-[640px] text-center">
          <h3 className="text-[1.3rem] font-semibold">
            ¿Se acaban las respuestas del mes?
          </h3>
          <p className="mt-2 text-[0.95rem] text-muted-foreground">
            Compra más desde el mismo panel, sin cambiar de plan.
          </p>
        </div>

        <div className="mx-auto mt-6 flex max-w-[560px] flex-col gap-3.5 sm:flex-row">
          {addOnes.map((addOn) => (
            <div
              key={addOn.nombre}
              className="flex flex-1 items-center justify-between rounded-xl border border-border bg-card px-5.5 py-4"
            >
              <span className="text-[0.92rem] font-medium">
                {addOn.nombre}
              </span>
              <span className="flex items-baseline gap-1 text-[1.05rem] font-semibold">
                {addOn.precio}
                <span className="font-sans text-[0.8rem] font-medium text-muted-foreground">
                  {addOn.periodo}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
