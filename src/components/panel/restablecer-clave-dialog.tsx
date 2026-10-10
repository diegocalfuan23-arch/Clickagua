"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { restablecerClaveSocio } from "@/app/panel/socios/actions";
import { generarClave } from "@/lib/clave";
import { formatearRut } from "@/lib/formato";
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

type Socio = { id: string; nombre: string; rut: string | null };

/**
 * La clave del portal de socios no se recupera por correo: el socio entra con
 * RUT y no tiene un correo real. Si la olvida, la directiva le pone una nueva
 * desde aquí y se la entrega (por teléfono, WhatsApp o en persona).
 */
export function RestablecerClaveDialog({
  socio,
  onCerrar,
}: {
  socio: Socio;
  onCerrar: () => void;
}) {
  const [clave, setClave] = useState(() => generarClave());
  const [hecho, setHecho] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave);
      toast.success("Clave copiada");
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: la clave queda visible para copiarla a mano.
    }
  }

  function guardar() {
    setError(null);
    iniciar(async () => {
      const r = await restablecerClaveSocio(socio.id, clave);
      if (r.ok) {
        setHecho(true);
        toast.success(`Clave de ${socio.nombre} restablecida`);
      } else {
        setError(r.error);
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {hecho ? "Clave restablecida" : "Restablecer clave"}
          </DialogTitle>
          <DialogDescription>
            {socio.nombre} · {formatearRut(socio.rut)}
          </DialogDescription>
        </DialogHeader>

        {hecho ? (
          <div className="flex flex-col gap-3 text-[0.92rem]">
            <p>
              Entrégale esta clave a {socio.nombre}. Entra con su RUT, y
              después no se vuelve a mostrar aquí.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <code className="flex-1 font-mono text-[1rem] tracking-wide">
                {clave}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copiar}>
                {copiada ? <Check className="text-forest" /> : <Copy />}
                {copiada ? "Copiada" : "Copiar"}
              </Button>
            </div>
            <p className="text-[0.82rem] text-muted-foreground">
              Se cerró cualquier sesión que tuviera abierta.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clave-nueva">Clave nueva</Label>
              <div className="flex gap-2">
                <Input
                  id="clave-nueva"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generar otra clave"
                  onClick={() => setClave(generarClave())}
                >
                  <RefreshCw />
                </Button>
              </div>
              <p className="text-[0.82rem] text-muted-foreground">
                Mínimo 8 caracteres. Reemplaza la que tenía y cierra sus
                sesiones abiertas.
              </p>
            </div>
            {error && <p className="text-[0.88rem] text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {hecho ? (
            <Button type="button" onClick={onCerrar}>
              Listo
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onCerrar}
                disabled={pendiente}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={guardar} disabled={pendiente}>
                {pendiente && <Loader2 className="animate-spin" />}
                Guardar clave
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
