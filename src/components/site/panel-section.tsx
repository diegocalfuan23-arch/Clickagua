import { Users, FileSpreadsheet, Wallet, MessageCircle } from "lucide-react";

const funciones = [
  {
    icon: Users,
    titulo: "Registro de socios",
    detalle:
      "Tu directiva carga cada socio con su nombre, RUT y teléfono desde el panel — uno por uno o todos de una vez.",
  },
  {
    icon: FileSpreadsheet,
    titulo: "Lecturas y boletas por periodo",
    detalle:
      "Registra la lectura del medidor de cada socio y emite las boletas del mes manualmente o por CSV. El panel del socio responde con esos mismos datos al instante.",
  },
  {
    icon: Wallet,
    titulo: "Estado de pagos y morosidad",
    detalle:
      "Ve de un vistazo qué socios están al día y cuáles tienen boletas pendientes, sin abrir una planilla aparte.",
  },
  {
    icon: MessageCircle,
    titulo: "Solicitudes de acceso",
    detalle:
      "Cada socio pide entrar con su RUT; tu directiva aprueba o rechaza desde el panel antes de que la cuenta exista.",
  },
];

export function PanelSection() {
  return (
    <section id="panel" className="py-23">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mx-auto mb-13 max-w-[640px] text-center">
          <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
            El otro pilar de Facilapr
          </span>
          <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)] font-semibold text-balance">
            Un panel para que tu directiva administre todo
          </h2>
          <p className="mt-3.5 text-[1.05rem] leading-relaxed text-muted-foreground">
            El panel de cada socio es la cara visible, pero detrás hay una
            plataforma donde tu comité gestiona socios, boletas y pagos —
            los datos que el asistente usa para responder.
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
