"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, UserCheck, X } from "lucide-react";
import {
  aprobarSolicitud,
  rechazarSolicitud,
} from "@/app/panel/socios/solicitudes/actions";
import { formatearRut, iniciales, tiempoRelativo } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Solicitud = {
  id: string;
  nombre: string;
  rut: string;
  createdAt: Date;
};

function FilaSolicitud({
  solicitud,
  onResuelta,
}: {
  solicitud: Solicitud;
  onResuelta: (id: string) => void;
}) {
  const [aprobando, iniciarAprobar] = useTransition();
  const [rechazando, iniciarRechazar] = useTransition();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function aprobar() {
    setError(null);
    iniciarAprobar(async () => {
      const r = await aprobarSolicitud(solicitud.id);
      if (r.ok) onResuelta(solicitud.id);
      else setError(r.error);
    });
  }

  function rechazar() {
    setError(null);
    iniciarRechazar(async () => {
      const r = await rechazarSolicitud(solicitud.id, motivo.trim());
      if (r.ok) {
        setDialogoAbierto(false);
        onResuelta(solicitud.id);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3.5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.75rem] font-semibold text-muted-foreground">
        {iniciales(solicitud.nombre)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{solicitud.nombre}</div>
        <div className="truncate text-[0.85rem] text-muted-foreground">
          {formatearRut(solicitud.rut)} · {tiempoRelativo(solicitud.createdAt)}
        </div>
      </div>

      {error && (
        <p className="max-w-[22ch] text-[0.8rem] text-destructive">{error}</p>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={aprobando || rechazando}
          onClick={() => setDialogoAbierto(true)}
        >
          <X className="size-4" />
          Rechazar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={aprobando || rechazando}
          onClick={aprobar}
        >
          {aprobando ? <Loader2 className="animate-spin" /> : <Check />}
          Aprobar
        </Button>
      </div>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              {solicitud.nombre} no podrá entrar a su panel. Puedes explicarle
              el motivo, o dejarlo en blanco.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: este RUT ya no pertenece al comité"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={rechazando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={rechazar}
              disabled={rechazando}
            >
              {rechazando && <Loader2 className="animate-spin" />}
              Rechazar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SolicitudesTabla({
  solicitudes,
}: {
  solicitudes: Solicitud[];
}) {
  const [pendientes, setPendientes] = useState(solicitudes);

  function onResuelta(id: string) {
    setPendientes((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[1.4rem] font-semibold">Solicitudes de acceso</h1>
      <p className="mt-1 max-w-[62ch] text-[0.9rem] text-muted-foreground">
        Socios que pidieron entrar a su panel con su RUT y una clave propia.
        Apruébalos solo si reconoces el RUT como parte del comité.
      </p>

      {pendientes.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <UserCheck className="size-5 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-[1rem] font-semibold">
            No hay solicitudes pendientes
          </h2>
          <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted-foreground">
            Cuando un socio pida acceso a su panel, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border/60 rounded-xl border border-border bg-card px-5">
          {pendientes.map((s) => (
            <FilaSolicitud key={s.id} solicitud={s} onResuelta={onResuelta} />
          ))}
        </div>
      )}
    </div>
  );
}
