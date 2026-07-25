import { Signal, BatteryMedium } from "lucide-react";

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[320px] max-[520px]:w-[280px] rounded-[52px] bg-gradient-to-br from-neutral-700 to-neutral-900 p-3.5 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.45),0_10px_24px_-8px_rgba(15,23,42,0.3),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="pointer-events-none absolute inset-[3px] rounded-[48px] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.06)]" />

      {/* Botones laterales */}
      <span className="absolute -right-0.5 top-[118px] h-[46px] w-[3px] rounded-l-sm bg-neutral-800" />
      <span className="absolute -right-0.5 top-[172px] h-[70px] w-[3px] rounded-l-sm bg-neutral-800" />
      <span className="absolute -left-0.5 top-[108px] h-[34px] w-[3px] rounded-r-sm bg-neutral-800" />
      <span className="absolute -left-0.5 top-[150px] h-[34px] w-[3px] rounded-r-sm bg-neutral-800" />

      <div className="relative overflow-hidden rounded-[38px] bg-card shadow-[inset_0_0_0_1px_rgba(3,105,161,0.06)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 flex h-[26px] w-[112px] -translate-x-1/2 items-center justify-center gap-2 rounded-b-[18px] bg-neutral-900">
          <span className="size-2 rounded-full bg-neutral-700 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.4)]" />
        </div>

        {/* Barra de estado */}
        <div className="flex items-center justify-between px-6.5 pt-4 pb-1 font-sans text-[0.78rem] font-semibold text-foreground">
          <span className="tabular-nums">21:47</span>
          <span className="flex items-center gap-1">
            <Signal className="size-3.5" />
            <BatteryMedium className="size-4" />
          </span>
        </div>

        {/* Cabecera de la conversación */}
        <div className="mb-4 flex items-center gap-2.5 border-b border-border px-5 pt-2.5 pb-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-display text-sm font-bold text-primary-foreground">
            CA
          </div>
          <div>
            <div className="text-sm font-semibold">APR Pitrelahué</div>
            <div className="flex items-center gap-1.5 text-[0.78rem] text-primary before:size-1.5 before:rounded-full before:bg-primary before:content-['']">
              en línea
            </div>
          </div>
        </div>

        {/* Burbujas */}
        <div className="flex flex-col gap-2.5 px-5 pb-5.5">
          <div className="max-w-[82%] self-end rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[0.87rem] leading-relaxed text-primary-foreground">
            Hola, cuánto debo?
          </div>
          <div className="max-w-[82%] self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-[0.87rem] leading-relaxed text-foreground">
            ¡Hola María! Revisé tu cuenta. Tienes{" "}
            <span className="font-mono font-bold tabular-nums text-secondary">1</span>{" "}
            boleta pendiente de junio por{" "}
            <span className="font-mono font-bold tabular-nums text-secondary">
              $8.450
            </span>
            , vence el 30/07.
          </div>
          <div className="max-w-[82%] self-end rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[0.87rem] leading-relaxed text-primary-foreground">
            graciasss
          </div>
          <div className="max-w-[82%] self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-[0.87rem] leading-relaxed text-foreground">
            De nada 🙂 Cualquier otra consulta sobre tu boleta, aquí estoy.
          </div>
        </div>
      </div>
    </div>
  );
}
