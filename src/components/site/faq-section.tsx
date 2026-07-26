import { ChevronDown } from "lucide-react";

const preguntas = [
  {
    pregunta: "¿Dónde quedan guardados los datos de nuestros socios?",
    respuesta:
      "En una base de datos propia de tu APR, separada de cualquier otro comité. Nunca compartimos ni vendemos información de socios a terceros.",
  },
  {
    pregunta: "¿Cómo cargamos las boletas que ya tenemos en Excel?",
    respuesta:
      "Se importan directamente desde una planilla CSV con el formato que ya suelen usar los APR (socio, RUT, periodo, monto). Te acompañamos en la primera carga.",
  },
  {
    pregunta: "¿Qué pasa si un socio pregunta algo que el bot no sabe responder?",
    respuesta:
      "El bot está limitado a consultas de deuda y boletas. Cualquier otra solicitud se responde derivando amablemente al socio a la oficina o al canal de contacto del comité.",
  },
  {
    pregunta: "¿Necesitamos instalar algo o cambiar de número de WhatsApp?",
    respuesta:
      "No hay que instalar nada. Puedes usar un número nuevo dedicado o migrar el que ya usan los socios para contactar al comité, conectado a la API oficial de WhatsApp de Meta.",
  },
  {
    pregunta: "¿El precio incluye IVA?",
    respuesta:
      "Los valores publicados son netos, en UF, más IVA — igual que la mayoría de los servicios contratados por un APR o SSR.",
  },
  {
    pregunta: "¿Hay contrato de permanencia mínima?",
    respuesta:
      "No. Puedes darte de baja cuando lo estime la directiva, sin multas ni plazos forzosos.",
  },
];

export function FaqSection() {
  return (
    <section id="preguntas" className="py-23">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mx-auto mb-13 max-w-[640px] text-center">
          <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
            Preguntas frecuentes
          </span>
          <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)] font-semibold text-balance">
            Lo que suele preguntar una directiva antes de partir
          </h2>
        </div>

        <div className="mx-auto flex max-w-[760px] flex-col gap-2.5">
          {preguntas.map(({ pregunta, respuesta }, i) => (
            <details
              key={pregunta}
              open={i === 0}
              className="group rounded-2xl border border-border bg-card px-5.5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[0.98rem] font-semibold [&::-webkit-details-marker]:hidden">
                <span>{pregunta}</span>
                <ChevronDown className="size-4.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
              </summary>
              <p className="mt-[-4px] mb-4.5 max-w-[62ch] text-[0.93rem] leading-relaxed text-muted-foreground">
                {respuesta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
