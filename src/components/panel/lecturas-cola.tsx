"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Users, X } from "lucide-react";
import { aprobarLectura, rechazarLectura } from "@/app/panel/lecturas/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type LecturaPendiente = {
  id: string;
  socio: string;
  rut: string;
  periodo: string;
  valor: number;
  observacion: string | null;
  createdAt: Date;
};

const fechaCorta = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function LecturasCola({
  pendientes,
}: {
  pendientes: LecturaPendiente[];
}) {
  const router = useRouter();
  const [rechazando, setRechazando] = useState<LecturaPendiente | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight">
            Lecturas por aprobar
          </h1>
          <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
            Cada lectura aprobada genera o actualiza la boleta del período.
          </p>
        </div>
        <Link
          href="/panel/tecnicos"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Users />
          Técnicos
        </Link>
      </div>

      {pendientes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-[0.9rem] text-muted-foreground">
          No hay lecturas pendientes de revisión.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
          {pendientes.map((l) => (
            <FilaLectura
              key={l.id}
              lectura={l}
              onRechazar={() => setRechazando(l)}
              onAprobada={() => router.refresh()}
            />
          ))}
        </div>
      )}

      <RechazarDialog
        lectura={rechazando}
        onOpenChange={(abierto) => !abierto && setRechazando(null)}
        onRechazada={() => router.refresh()}
      />
    </div>
  );
}

function FilaLectura({
  lectura,
  onRechazar,
  onAprobada,
}: {
  lectura: LecturaPendiente;
  onRechazar: () => void;
  onAprobada: () => void;
}) {
  const [aprobando, iniciarAprobar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-medium">{lectura.socio}</span>
          <span className="text-[0.82rem] text-muted-foreground">
            {lectura.rut}
          </span>
        </div>
        <div className="text-[0.85rem] text-muted-foreground">
          Período {lectura.periodo} · lectura {lectura.valor} ·{" "}
          {fechaCorta.format(lectura.createdAt)}
        </div>
        {lectura.observacion && (
          <p className="mt-1 text-[0.85rem] text-muted-foreground">
            &ldquo;{lectura.observacion}&rdquo;
          </p>
        )}
        {error && (
          <p className="mt-1 text-[0.85rem] text-destructive">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={aprobando}
          onClick={onRechazar}
        >
          <X />
          Rechazar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={aprobando}
          onClick={() =>
            iniciarAprobar(async () => {
              setError(null);
              const r = await aprobarLectura(lectura.id);
              if (!r.ok) setError(r.error);
              else onAprobada();
            })
          }
        >
          {aprobando ? <Loader2 className="animate-spin" /> : <Check />}
          Aprobar
        </Button>
      </div>
    </div>
  );
}

function RechazarDialog({
  lectura,
  onOpenChange,
  onRechazada,
}: {
  lectura: LecturaPendiente | null;
  onOpenChange: (abierto: boolean) => void;
  onRechazada: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function enviar() {
    if (!lectura) return;
    setError(null);
    iniciar(async () => {
      const r = await rechazarLectura(lectura.id, motivo);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setMotivo("");
      onOpenChange(false);
      onRechazada();
    });
  }

  return (
    <Dialog open={lectura !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Rechazar lectura</DialogTitle>
          <DialogDescription>
            {lectura && `${lectura.socio} · período ${lectura.periodo} · lectura ${lectura.valor}`}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          rows={3}
          maxLength={300}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: la lectura anterior era 1400, esta parece un error de tipeo."
        />

        {error && <p className="text-[0.85rem] text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={pendiente} onClick={enviar}>
            {pendiente && <Loader2 className="animate-spin" />}
            Rechazar lectura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
