"use client";

import { useMemo, useState, useTransition } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { alternarActivo, eliminarSocio } from "@/app/panel/socios/actions";
import { SocioDialog, type SocioEditable } from "./socio-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatearRut, formatearTelefono, iniciales } from "@/lib/formato";

export type SocioFila = SocioEditable & { activo: boolean };

export function SociosTabla({ socios }: { socios: SocioFila[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<SocioFila | null>(null);
  const [porEliminar, setPorEliminar] = useState<SocioFila | null>(null);
  const [pendiente, startTransition] = useTransition();

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return socios;

    return socios.filter((socio) =>
      [socio.nombre, socio.rut, socio.telefono, socio.numeroCliente ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(termino)
    );
  }, [socios, busqueda]);

  const activos = socios.filter((s) => s.activo).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] font-semibold tracking-tight">Socios</h1>
          <p className="mt-1 text-[0.93rem] text-muted-foreground">
            {socios.length === 0
              ? "Aún no has cargado socios."
              : `${activos} ${activos === 1 ? "activo" : "activos"} de ${socios.length} registrados.`}
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus />
          Nuevo socio
        </Button>
      </div>

      {socios.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-[1rem] font-semibold">
            Carga a tu primer socio
          </h2>
          <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted-foreground">
            El bot de WhatsApp responde solo a los socios que estén registrados
            aquí, identificándolos por su teléfono o RUT.
          </p>
          <Button className="mt-5" onClick={() => setCreando(true)}>
            <Plus />
            Nuevo socio
          </Button>
        </div>
      ) : (
        <>
          <div className="relative max-w-95">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, RUT o teléfono…"
              aria-label="Buscar socios"
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/50 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-[0.92rem] text-muted-foreground"
                    >
                      Ningún socio coincide con «{busqueda}».
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((socio) => (
                    <TableRow key={socio.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.72rem] font-semibold text-primary">
                            {iniciales(socio.nombre)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {socio.nombre}
                            </div>
                            {socio.numeroCliente && (
                              <div className="text-[0.78rem] text-muted-foreground tabular-nums">
                                N.º {socio.numeroCliente}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatearRut(socio.rut)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatearTelefono(socio.telefono)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {socio.direccion ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium",
                            socio.activo
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              socio.activo ? "bg-primary" : "bg-muted-foreground"
                            )}
                          />
                          {socio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Acciones para ${socio.nombre}`}
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditando(socio)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                startTransition(async () => {
                                  await alternarActivo(socio.id, !socio.activo);
                                })
                              }
                            >
                              {socio.activo ? <UserX /> : <UserCheck />}
                              {socio.activo
                                ? "Marcar inactivo"
                                : "Marcar activo"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPorEliminar(socio)}
                            >
                              <Trash2 />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <SocioDialog abierto={creando} onAbiertoChange={setCreando} />

      {editando && (
        <SocioDialog
          abierto
          onAbiertoChange={(v) => !v && setEditando(null)}
          socio={editando}
        />
      )}

      <Dialog
        open={Boolean(porEliminar)}
        onOpenChange={(v) => !v && setPorEliminar(null)}
      >
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Eliminar a {porEliminar?.nombre}</DialogTitle>
            <DialogDescription>
              Se borrarán también sus boletas y el historial de conversaciones.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPorEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  if (porEliminar) await eliminarSocio(porEliminar.id);
                  setPorEliminar(null);
                })
              }
            >
              {pendiente ? "Eliminando…" : "Eliminar socio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
