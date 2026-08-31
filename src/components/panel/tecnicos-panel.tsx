"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, UserPlus, Clock } from "lucide-react";
import { generarInvitacionOperador } from "@/app/panel/lecturas/actions";
import { cancelarInvitacion } from "@/app/panel/tecnicos/actions";
import { iniciales } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
          Técnicos activos
        </h2>
        {tecnicos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[0.9rem] text-muted-foreground">
            Todavía no tienes técnicos invitados.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
            {tecnicos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.75rem] font-semibold text-muted-foreground">
                  {iniciales(t.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.nombre}</div>
                  <div className="truncate text-[0.82rem] text-muted-foreground">
                    {t.correo}
                  </div>
                </div>
                <span className="shrink-0 text-[0.8rem] text-muted-foreground">
                  Desde {fecha.format(t.desde)}
                </span>
              </div>
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
            <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[0.87rem]">
                {url}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={copiar}>
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
