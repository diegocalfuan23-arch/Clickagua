"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { registrarLectura, type ResultadoAccion } from "@/app/panel/lecturas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Socio = { id: string; nombre: string; rut: string };

type LecturaReciente = {
  id: string;
  socio: string;
  periodo: string;
  valor: number;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  motivoRechazo: string | null;
};

const ESTADO_META = {
  PENDIENTE: { texto: "Pendiente de revisión", icono: Clock, color: "text-tertiary-texto" },
  APROBADA: { texto: "Aprobada", icono: CheckCircle2, color: "text-forest" },
  RECHAZADA: { texto: "Rechazada", icono: XCircle, color: "text-destructive" },
} as const;

const periodoActual = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
};

export function LecturaForm({
  socios,
  recientes,
}: {
  socios: Socio[];
  recientes: LecturaReciente[];
}) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(registrarLectura, null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5">
      <div>
        <h1 className="text-[1.35rem] font-semibold tracking-tight">
          Cargar lectura
        </h1>
        <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
          Queda pendiente hasta que el administrador la revise.
        </p>
      </div>

      <form
        ref={formRef}
        action={accion}
        className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="socioId">Socio</Label>
          <select
            id="socioId"
            name="socioId"
            defaultValue=""
            required
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Elige un socio…
            </option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} — {s.rut}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="periodo">Período</Label>
            <Input
              id="periodo"
              name="periodo"
              defaultValue={periodoActual()}
              placeholder="2026-07"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valor">Lectura del medidor</Label>
            <Input
              id="valor"
              name="valor"
              inputMode="numeric"
              placeholder="1250"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="observacion">Observación (opcional)</Label>
          <Textarea
            id="observacion"
            name="observacion"
            rows={2}
            maxLength={300}
            placeholder="Medidor con humedad, difícil de leer con precisión…"
          />
        </div>

        {estado && !estado.ok && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive">
            {estado.error}
          </p>
        )}
        {estado?.ok && (
          <p className="rounded-lg border border-forest/30 bg-forest/5 px-4 py-3 text-[0.88rem] text-forest">
            Lectura registrada. Queda pendiente de revisión.
          </p>
        )}

        <Button type="submit" disabled={pendiente}>
          {pendiente && <Loader2 className="animate-spin" />}
          Registrar lectura
        </Button>
      </form>

      <section>
        <h2 className="text-[0.95rem] font-semibold">Tus últimas lecturas</h2>
        {recientes.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-8 text-center text-[0.9rem] text-muted-foreground">
            Todavía no has cargado lecturas.
          </p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
            {recientes.map((l) => {
              const meta = ESTADO_META[l.estado];
              const Icono = meta.icono;
              return (
                <div key={l.id} className="flex items-start gap-3 p-3.5">
                  <Icono className={cn("mt-0.5 size-4 shrink-0", meta.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="truncate text-[0.9rem] font-medium">
                        {l.socio}
                      </span>
                      <span className="text-[0.82rem] text-muted-foreground">
                        {l.periodo}
                      </span>
                    </div>
                    <div className={cn("text-[0.82rem]", meta.color)}>
                      {meta.texto} · lectura {l.valor}
                    </div>
                    {l.estado === "RECHAZADA" && l.motivoRechazo && (
                      <p className="mt-1 text-[0.82rem] text-muted-foreground">
                        Motivo: {l.motivoRechazo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
