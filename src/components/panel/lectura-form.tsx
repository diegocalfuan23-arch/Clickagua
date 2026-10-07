"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
  WifiOff,
  XCircle,
} from "lucide-react";
import { registrarLectura } from "@/app/panel/lecturas/actions";
import { InstalarApp } from "@/components/socio/instalar-app";
import {
  COLA_VACIA,
  encolarLectura,
  hayConexion,
  parsearCola,
  quitarDeCola,
  snapshotCola,
  suscribirCola,
  suscribirConexion,
  type LecturaEnCola,
} from "@/lib/lecturas-offline";
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

type EstadoForm =
  | { ok: true; enCola?: boolean }
  | { ok: false; error: string };

/** Lecturas que el servidor rechazó al sincronizar (p. ej. período inválido). */
type Rechazada = { lectura: LecturaEnCola; error: string };

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
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const enviandoCola = useRef(false);
  const [rechazadas, setRechazadas] = useState<Rechazada[]>([]);

  const crudoCola = useSyncExternalStore(
    suscribirCola,
    snapshotCola,
    () => COLA_VACIA
  );
  const cola = useMemo(() => parsearCola(crudoCola), [crudoCola]);
  const enLinea = useSyncExternalStore(suscribirConexion, hayConexion, () => true);

  function guardarSinConexion(formData: FormData): EstadoForm {
    const socioId = String(formData.get("socioId") ?? "");
    const guardada = encolarLectura({
      socioId,
      socioNombre: socios.find((s) => s.id === socioId)?.nombre ?? "Socio",
      periodo: String(formData.get("periodo") ?? ""),
      valor: String(formData.get("valor") ?? ""),
      observacion: String(formData.get("observacion") ?? ""),
    });
    return guardada
      ? { ok: true, enCola: true }
      : {
          ok: false,
          error:
            "No hay señal y este teléfono no dejó guardar la lectura. Anótala y envíala cuando tengas conexión.",
        };
  }

  const [estado, accion, pendiente] = useActionState<EstadoForm | null, FormData>(
    async (_prev, formData) => {
      if (!hayConexion()) return guardarSinConexion(formData);
      try {
        return await registrarLectura(null, formData);
      } catch (error) {
        // Señal que se cayó justo al enviar. Cualquier otro error es un bug
        // real y no debe esconderse en la cola.
        if (error instanceof TypeError || !hayConexion()) {
          return guardarSinConexion(formData);
        }
        throw error;
      }
    },
    null
  );

  useEffect(() => {
    if (estado?.ok) formRef.current?.reset();
  }, [estado]);

  // El service worker deja abierta esta pantalla sin señal. Sin soporte o con
  // un fallo al registrarlo, el formulario sigue funcionando: solo no abre
  // offline desde cero.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/panel/lecturas" })
      .catch(() => {});
  }, []);

  async function enviarCola() {
    if (enviandoCola.current) return;
    enviandoCola.current = true;
    let enviadas = 0;
    try {
      for (const lectura of parsearCola(snapshotCola())) {
        const datos = new FormData();
        datos.set("socioId", lectura.socioId);
        datos.set("periodo", lectura.periodo);
        datos.set("valor", lectura.valor);
        if (lectura.observacion) datos.set("observacion", lectura.observacion);

        try {
          const r = await registrarLectura(null, datos);
          quitarDeCola(lectura.idLocal);
          if (r.ok) enviadas++;
          else setRechazadas((prev) => [...prev, { lectura, error: r.error }]);
        } catch {
          break; // sigue sin señal: se reintenta al volver la conexión
        }
      }
    } finally {
      enviandoCola.current = false;
    }
    if (enviadas > 0) router.refresh();
  }

  // Al volver la señal (o al abrir la pantalla con conexión) se vacía la cola.
  useEffect(() => {
    if (enLinea && cola.length > 0) void enviarCola();
    // enviarCola solo usa refs y el store local: no depende del render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enLinea, cola.length]);

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

      <InstalarApp
        titulo="Lleva la app a terreno"
        descripcion="Instálala en tu celular: abre más rápido y puedes cargar lecturas aunque no haya señal."
      />

      {!enLinea && (
        <div className="flex items-start gap-2.5 rounded-xl border border-tertiary/40 bg-tertiary/10 px-4 py-3">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-tertiary" />
          <p className="text-[0.88rem] leading-relaxed">
            <strong>Sin conexión.</strong> Sigue cargando lecturas: quedan
            guardadas en este teléfono y se envían solas cuando vuelva la
            señal.
          </p>
        </div>
      )}

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
            {estado.enCola
              ? "Guardada en este teléfono. Se enviará sola cuando vuelva la señal."
              : "Lectura registrada. Queda pendiente de revisión."}
          </p>
        )}

        <Button type="submit" disabled={pendiente}>
          {pendiente && <Loader2 className="animate-spin" />}
          Registrar lectura
        </Button>
      </form>

      {cola.length > 0 && (
        <section className="rounded-xl border border-tertiary/40 bg-tertiary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[0.95rem] font-semibold">
              {cola.length}{" "}
              {cola.length === 1 ? "lectura esperando" : "lecturas esperando"}{" "}
              envío
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!enLinea}
              onClick={() => void enviarCola()}
            >
              Enviar ahora
            </Button>
          </div>
          <ul className="mt-2 flex flex-col gap-1 text-[0.85rem] text-muted-foreground">
            {cola.map((l) => (
              <li key={l.idLocal}>
                {l.socioNombre} · {l.periodo} · lectura {l.valor}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rechazadas.length > 0 && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="text-[0.95rem] font-semibold text-destructive">
            No se pudieron registrar
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-[0.85rem]">
            {rechazadas.map((r) => (
              <li key={r.lectura.idLocal}>
                {r.lectura.socioNombre} · {r.lectura.periodo} · lectura{" "}
                {r.lectura.valor}: {r.error}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setRechazadas([])}
          >
            Entendido
          </Button>
        </section>
      )}

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
