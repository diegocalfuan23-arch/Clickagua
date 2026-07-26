import { ShieldCheck, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhoneMockup } from "./phone-mockup";

export function Hero() {
  return (
    <section className="pt-16 pb-10 text-center">
      <div className="mx-auto flex max-w-[720px] flex-col items-center px-7">
        <span className="rounded-full bg-primary/10 px-3.5 py-1.5 font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
          Gestión de socios y boletas para APR y SSR · Chile
        </span>
        <h1 className="mt-5.5 mb-5 text-[clamp(2.6rem,5.2vw,4.1rem)] leading-[1.05] font-semibold text-balance">
          Que tu comité de agua
          <br />
          conteste solo, por <em className="text-primary italic">WhatsApp</em>.
        </h1>
        <p className="mb-8 max-w-[46ch] text-[1.16rem] leading-relaxed text-muted-foreground">
          ClickAgua responde automáticamente cuánto debe cada socio de tu APR
          o SSR, a cualquier hora, por el mismo WhatsApp que la gente ya usa
          todos los días.
        </p>
        <div className="mb-2 flex flex-wrap justify-center gap-3.5">
          <a
            href="#contacto"
            className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-6")}
          >
            Solicitar una demo
          </a>
          <a
            href="#como-funciona"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 rounded-full bg-forest px-6 text-forest-foreground hover:bg-forest/90"
            )}
          >
            Ver cómo funciona
          </a>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1180px] px-7 pt-14">
        <PhoneMockup />

        <div className="absolute top-[38%] left-[3%] hidden items-center gap-3 rounded-2xl border border-border bg-card/92 px-4.5 py-3.5 text-[0.82rem] shadow-md backdrop-blur-sm min-[980px]:flex animate-[flotar_5s_ease-in-out_infinite]">
          <ShieldCheck className="size-4.5 shrink-0 text-primary" />
          <div>
            <strong className="block text-sm">API oficial de Meta</strong>
            <span className="text-muted-foreground">Sin apps de terceros</span>
          </div>
        </div>

        <div className="absolute top-[58%] right-[3%] hidden items-center gap-3 rounded-2xl border border-border bg-card/92 px-4.5 py-3.5 text-[0.82rem] shadow-md backdrop-blur-sm min-[980px]:flex animate-[flotar_5s_ease-in-out_infinite] [animation-delay:1.1s]">
          <Zap className="size-4.5 shrink-0 text-primary" />
          <div>
            <strong className="block text-sm">&lt;10 segundos</strong>
            <span className="text-muted-foreground">tiempo de respuesta</span>
          </div>
        </div>
      </div>
    </section>
  );
}
