"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  crearSocio,
  editarSocio,
  type ResultadoAccion,
} from "@/app/panel/socios/actions";
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

export type SocioEditable = {
  id: string;
  nombre: string;
  rut: string;
  telefono: string;
  direccion: string | null;
  numeroCliente: string | null;
};

export function SocioDialog({
  abierto,
  onAbiertoChange,
  socio,
}: {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  socio?: SocioEditable;
}) {
  const editando = Boolean(socio);
  const [estado, accion, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(editando ? editarSocio : crearSocio, null);

  useEffect(() => {
    if (estado?.ok) onAbiertoChange(false);
  }, [estado, onAbiertoChange]);

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar socio" : "Nuevo socio"}</DialogTitle>
          <DialogDescription>
            El teléfono es el que usará el socio para consultar por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form action={accion} className="flex flex-col gap-4">
          {socio && <input type="hidden" name="socioId" value={socio.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={socio?.nombre}
              placeholder="María Huenchuñir"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                name="rut"
                defaultValue={socio?.rut}
                placeholder="12.345.678-9"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                defaultValue={socio?.telefono}
                placeholder="9 1234 5678"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numeroCliente">N.º de cliente</Label>
              <Input
                id="numeroCliente"
                name="numeroCliente"
                defaultValue={socio?.numeroCliente ?? ""}
                placeholder="Opcional"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                defaultValue={socio?.direccion ?? ""}
                placeholder="Opcional"
              />
            </div>
          </div>

          {estado && !estado.ok && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-[0.88rem] text-destructive"
            >
              {estado.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAbiertoChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente && <Loader2 className="animate-spin" />}
              {pendiente
                ? "Guardando…"
                : editando
                  ? "Guardar cambios"
                  : "Guardar socio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
