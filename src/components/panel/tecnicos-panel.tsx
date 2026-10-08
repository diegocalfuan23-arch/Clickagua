"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, UserPlus, Clock } from "lucide-react";
import { generarInvitacionOperador } from "@/app/panel/lecturas/actions";
import {
  cancelarInvitacion,
  desactivarOperador,
  reactivarOperador,
} from "@/app/panel/tecnicos/actions";
import { iniciales } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fecha = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export type Tecnico = {
  id: string;
  nombre: string;
  correo: string;
  desde: Date;
  /** false = desactivado por la directiva: no puede entrar. */
  activo: boolean;
};

export type InvitacionPendiente = {
  id: string;
  codigo: string;
  expiraEn: Date;
  creadaEn: Date;
};

export function TecnicosPanel({
  tecnicos,
  invitacionesPendientes,
}: {
  tecnicos: Tecnico[];
  invitacionesPendientes: InvitacionPendiente[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight">
            Técnicos
          </h1>
          <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
            Quienes cargan lecturas en terreno para tu comité. No ven socios
            ni boletas — tú apruebas cada lectura antes de que cuente.
          </p>
        </div>
        <InvitarTecnico />
      </div>

      <section>
        <h2 className="mb-3 text-[0.95rem] font-semibold">
          Técnicos
        </h2>
        {tecnicos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[0.9rem] text-muted-foreground">
            Todavía no tienes técnicos invitados.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
            {tecnicos.map((t) => (
              <TecnicoFila key={t.id} tecnico={t} />
            ))}
          </div>
        )}
      </section>

      {invitacionesPendientes.length > 0 && (
        <section>
          <h2 className="mb-3 text-[0.95rem] font-semibold">
            Invitaciones pendientes
          </h2>
          <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
            {invitacionesPendientes.map((inv) => (
              <InvitacionFila key={inv.id} invitacion={inv} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TecnicoFila({ tecnico: t }: { tecnico: Tecnico }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [trabajando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cambiar(accion: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    iniciar(async () => {
      const r = await accion();
      if (r.ok) {
        setConfirmando(false);
        router.refresh();
      } else {
        setError(r.error ?? "No pudimos completar la acción.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.75rem] font-semibold text-muted-foreground",
          !t.activo && "opacity-60"
        )}
      >
        {iniciales(t.nombre)}
      </span>
      <div className={cn("min-w-0 flex-1", !t.activo && "opacity-60")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{t.nombre}</span>
          {!t.activo && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.72rem] font-medium text-destructive">
              Desactivado
            </span>
          )}
        </div>
        <div className="truncate text-[0.82rem] text-muted-foreground">
          {t.correo}
        </div>
      </div>
      <span className="shrink-0 text-[0.8rem] text-muted-foreground">
        Desde {fecha.format(t.desde)}
      </span>
      {t.activo ? (
        <Button variant="outline" size="sm" onClick={() => setConfirmando(true)}>
          Desactivar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={trabajando}
          onClick={() => cambiar(() => reactivarOperador(t.id))}
        >
          {trabajando && <Loader2 className="animate-spin" />}
          Reactivar
        </Button>
      )}
      {error && !confirmando && (
        <p className="w-full text-[0.8rem] text-destructive">{error}</p>
      )}

      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent className="sm:max-w-105">
          <DialogHeader>
            <DialogTitle>Desactivar a {t.nombre}</DialogTitle>
            <DialogDescription>
              Dejará de poder entrar y se cerrará su sesión. Sus lecturas ya
              cargadas se conservan en el historial. Puedes reactivarlo cuando
              quieras.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-[0.85rem] text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={trabajando}
              onClick={() => cambiar(() => desactivarOperador(t.id))}
            >
              {trabajando && <Loader2 className="animate-spin" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvitacionFila({ invitacion }: { invitacion: InvitacionPendiente }) {
  const router = useRouter();
  const [cancelando, iniciar] = useTransition();

  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tertiary/15 text-tertiary-foreground">
        <Clock className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">Invitación sin usar</div>
        <div className="text-[0.82rem] text-muted-foreground">
          Vence el {fecha.format(invitacion.expiraEn)}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={cancelando}
        onClick={() =>
          iniciar(async () => {
            await cancelarInvitacion(invitacion.id);
            router.refresh();
          })
        }
      >
        {cancelando && <Loader2 className="animate-spin" />}
        Cancelar
      </Button>
    </div>
  );
}

function InvitarTecnico() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [generando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setAbierto(true);
    setUrl(null);
    setError(null);
    iniciar(async () => {
      const r = await generarInvitacionOperador();
      if (r.ok) setUrl(r.url);
      else setError(r.error);
    });
  }

  async function copiar() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <Button type="button" onClick={abrir}>
        <UserPlus />
        Invitar técnico
      </Button>

      <Dialog
        open={abierto}
        onOpenChange={(v) => {
          setAbierto(v);
          if (!v) router.refresh();
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Invitar técnico</DialogTitle>
            <DialogDescription>
              Comparte este enlace por WhatsApp o correo. Sirve una sola vez
              y vence en 7 días.
            </DialogDescription>
          </DialogHeader>

          {generando && (
            <div className="flex items-center gap-2 text-[0.9rem] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Generando enlace…
            </div>
          )}

          {error && <p className="text-[0.88rem] text-destructive">{error}</p>}

          {url && (
            // min-w-0: el modal es un grid y sus hijos no se achican por debajo
            // del contenido; sin esto el enlace largo ensancha todo y el botón
            // queda fuera del recuadro.
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2">
              <span
                title={url}
                className="min-w-0 flex-1 truncate text-[0.87rem]"
              >
                {url}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={copiar}
              >
                {copiado ? <Check className="text-forest" /> : <Copy />}
                {copiado ? "Copiado" : "Copiar"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
