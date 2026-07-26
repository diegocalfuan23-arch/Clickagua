import { Users, FileSpreadsheet, Wallet, BotMessageSquare } from "lucide-react";

const funciones = [
  {
    icon: Users,
    titulo: "Registro de socios",
    detalle:
      "Tu directiva carga cada socio con su nombre, RUT y teléfono desde el panel — uno por uno o todos de una vez.",
  },
  {
    icon: FileSpreadsheet,
    titulo: "Carga de boletas por periodo",
    detalle:
      "Sube las boletas del mes manualmente o importa un CSV completo. El bot responde con esos mismos datos al instante.",
  },
  {
    icon: Wallet,
    titulo: "Estado de pagos y morosidad",
    detalle:
      "Ve de un vistazo qué socios están al día y cuáles tienen boletas pendientes, sin abrir una planilla aparte.",
  },
  {
    icon: BotMessageSquare,
    titulo: "Historial de conversaciones",
    detalle:
      "Revisa qué le preguntó cada socio al bot y qué le respondió, para resolver dudas o reclamos con contexto real.",
  },
];

export function PanelSection() {
  return (
    <section id="panel" className="py-23">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mx-auto mb-13 max-w-[640px] text-center">
          <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
            El otro pilar de ClickAgua
          </span>
          <h2 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.4rem)] font-semibold text-balance">
            Un panel para que tu directiva administre todo
          </h2>
          <p className="mt-3.5 text-[1.05rem] leading-relaxed text-muted-foreground">
            El WhatsApp automático es la cara visible, pero detrás hay una
            plataforma donde tu comité gestiona socios, boletas y pagos —
            los datos que el bot usa para responder.
          </p>
        </div>

        <div className="grid gap-5.5 sm:grid-cols-2">
          {funciones.map(({ icon: Icon, titulo, detalle }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-border bg-card p-6.5"
            >
              <div className="mb-4.5 flex size-10 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
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
