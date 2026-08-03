"use client";

import { useEffect, useRef, useState } from "react";
import { Droplets, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mensaje = { rol: "user" | "assistant"; texto: string };

const SUGERENCIAS = [
  "¿Hay corte de agua?",
  "¿Cuál es el horario de atención?",
  "¿Dónde puedo pagar?",
];

/**
 * Widget del sitio de un comité. Habla como el comité, no como FacilAgua:
 * para el vecino que entra, este es el sitio de su APR.
 */
export function AsistenteComite({
  nombreApr,
  slug,
  dominio,
  telefono,
}: {
  nombreApr: string;
  slug?: string;
  dominio?: string;
  telefono: string | null;
}) {
  const saludo = `Hola 👋 Soy el asistente de ${nombreApr}. Puedo contarte sobre cortes de agua, horarios de atención, tarifas y cómo pagar. ¿En qué te ayudo?`;

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: "assistant", texto: saludo },
  ]);
  const [entrada, setEntrada] = useState("");
  const [respondiendo, setRespondiendo] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const whatsapp = telefono?.replace(/[^0-9]/g, "");

  async function enviar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || respondiendo) return;

    const historial: Mensaje[] = [...mensajes, { rol: "user", texto: pregunta }];
    setMensajes([...historial, { rol: "assistant", texto: "" }]);
    setEntrada("");
    setRespondiendo(true);

    try {
      const res = await fetch("/api/sitio/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          dominio,
          // El saludo lo pone el cliente: no es parte de la conversación.
          mensajes: historial.slice(1),
        }),
      });

      if (!res.ok || !res.body) throw new Error("respuesta inválida");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        acumulado += decoder.decode(value, { stream: true });
        setMensajes([...historial, { rol: "assistant", texto: acumulado }]);
      }
    } catch {
      setMensajes([
        ...historial,
        {
          rol: "assistant",
          texto: whatsapp
            ? "Disculpa, no pude responder en este momento. Escríbenos por WhatsApp y te ayudamos."
            : "Disculpa, no pude responder en este momento. Contáctate directamente con el comité.",
        },
      ]);
    } finally {
      setRespondiendo(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
        className="fixed right-5 bottom-5 z-50 size-13 rounded-md border-[3px] border-[#1a1a1a] bg-[#C3F207] text-[#1a1a1a] shadow-lg hover:bg-[#C3F207]/90"
      >
        {abierto ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>

      {abierto && (
        <div className="fixed right-5 bottom-22 z-50 flex h-[520px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-md border-[3px] border-[#1a1a1a] bg-white shadow-xl">
          <div className="flex shrink-0 items-center gap-2.5 border-b-[3px] border-[#1a1a1a] bg-primary px-4 py-3.5 text-white">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-white">
              <Droplets className="size-4 text-white" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold uppercase tracking-wide">
                {nombreApr}
              </div>
              <div className="text-[0.75rem] text-white/75">
                Responde al instante
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.88rem] leading-relaxed whitespace-pre-line",
                  m.rol === "user"
                    ? "self-end rounded-br-md bg-primary text-primary-foreground"
                    : "self-start rounded-bl-md bg-muted text-foreground"
                )}
              >
                {m.texto || (
                  <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
                    <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:0.15s]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:0.3s]" />
                  </span>
                )}
              </div>
            ))}

            {mensajes.length === 1 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-[0.8rem] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={finRef} />
          </div>

          {/* La deuda no se responde aquí: se deriva a WhatsApp, donde el
              número identifica al socio. */}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border-t border-border bg-muted/40 px-4 py-2.5 text-center text-[0.8rem] text-muted-foreground transition-colors hover:text-primary"
            >
              ¿Consultas sobre tu cuenta?{" "}
              <span className="font-medium text-primary">
                Escríbenos por WhatsApp
              </span>
            </a>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-3"
          >
            <Input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu consulta…"
              maxLength={1000}
              aria-label="Tu consulta"
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={respondiendo || !entrada.trim()}
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
