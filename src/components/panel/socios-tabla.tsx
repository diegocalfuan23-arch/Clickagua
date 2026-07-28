"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { alternarActivo, eliminarSocio } from "@/app/panel/socios/actions";
import { SocioDialog, type SocioEditable } from "./socio-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type Pestana = "todos" | "activos" | "inactivos";
type Columna = "nombre" | "rut" | "telefono";

const POR_PAGINA = 12;

/** Tarjeta de métrica del encabezado: ícono en recuadro, etiqueta y cifra. */
function TarjetaResumen({
  icono,
  color,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode;
  color: string;
  etiqueta: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg [&_svg]:size-5",
          color
        )}
      >
        {icono}
      </span>
      <div className="mt-8 text-[0.9rem] text-muted-foreground">{etiqueta}</div>
      <div className="mt-1 text-[1.75rem] leading-none font-semibold tabular-nums">
        {valor}
      </div>
    </div>
  );
}

/** Encabezado de columna ordenable. */
function ColumnaOrdenable({
  children,
  columna,
  activa,
  onOrdenar,
}: {
  children: React.ReactNode;
  columna: Columna;
  activa: boolean;
  onOrdenar: (c: Columna) => void;
}) {
  return (
    <TableHead className="h-11 px-4">
      <button
        type="button"
        onClick={() => onOrdenar(columna)}
        className={cn(
          "flex items-center gap-1.5 text-[0.87rem] font-medium transition-colors hover:text-foreground",
          activa ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
        <ChevronsUpDown className="size-3.5" />
      </button>
    </TableHead>
  );
}

export function SociosTabla({ socios }: { socios: SocioFila[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState<Pestana>("todos");
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({
    columna: "nombre",
    asc: true,
  });
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<SocioFila | null>(null);
  const [porEliminar, setPorEliminar] = useState<SocioFila | null>(null);
  const [pendiente, startTransition] = useTransition();

  const activos = socios.filter((s) => s.activo).length;
  const inactivos = socios.length - activos;
  const conTelefono = socios.filter((s) => s.telefono).length;

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const base = socios.filter((socio) => {
      if (pestana === "activos" && !socio.activo) return false;
      if (pestana === "inactivos" && socio.activo) return false;
      if (!termino) return true;

      return [socio.nombre, socio.rut, socio.telefono, socio.numeroCliente ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(termino);
    });

    return [...base].sort((a, b) => {
      const cmp = a[orden.columna].localeCompare(b[orden.columna], "es", {
        numeric: true,
      });
      return orden.asc ? cmp : -cmp;
    });
  }, [socios, busqueda, pestana, orden]);

  // Si un filtro deja la página actual fuera de rango, volvemos a la primera.
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  const todasMarcadas =
    visibles.length > 0 && visibles.every((s) => seleccion.has(s.id));

  function alternarOrden(columna: Columna) {
    setOrden((prev) =>
      prev.columna === columna
        ? { columna, asc: !prev.asc }
        : { columna, asc: true }
    );
  }

  function alternarSeleccion(id: string) {
    setSeleccion((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function alternarTodas() {
    setSeleccion((prev) => {
      const siguiente = new Set(prev);
      if (todasMarcadas) visibles.forEach((s) => siguiente.delete(s.id));
      else visibles.forEach((s) => siguiente.add(s.id));
      return siguiente;
    });
  }

  /** Cualquier cambio de filtro reinicia la paginación. */
  function cambiarPestana(siguiente: Pestana) {
    setPestana(siguiente);
    setPagina(1);
  }

  const pestanas: { id: Pestana; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "activos", label: "Activos" },
    { id: "inactivos", label: "Inactivos" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[1.35rem] font-semibold tracking-tight">Socios</h1>
        <Button onClick={() => setCreando(true)}>
          <Plus />
          Nuevo socio
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TarjetaResumen
          icono={<Users />}
          color="bg-primary/10 text-primary"
          etiqueta="Total de socios"
          valor={socios.length}
        />
        <TarjetaResumen
          icono={<UserCheck />}
          color="bg-forest/10 text-forest"
          etiqueta="Socios activos"
          valor={activos}
        />
        <TarjetaResumen
          icono={<MessageCircle />}
          color="bg-tertiary/15 text-tertiary"
          etiqueta="Con WhatsApp registrado"
          valor={conTelefono}
        />
      </div>

      {socios.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-5 text-muted-foreground" />
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
        <div className="rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Pestañas: filtran por estado sin sacar al usuario de la página. */}
          <div className="flex gap-6 border-b border-border/60 px-5">
            {pestanas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => cambiarPestana(p.id)}
                className={cn(
                  "-mb-px border-b-2 py-3.5 text-[0.9rem] font-medium transition-colors",
                  pestana === p.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
                {p.id !== "todos" && (
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {p.id === "activos" ? activos : inactivos}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por nombre, RUT o teléfono…"
                aria-label="Buscar socios"
                className="h-10 border-transparent bg-muted/60 pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto border-y border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-11 w-11 pl-5">
                    <Checkbox
                      checked={todasMarcadas}
                      onCheckedChange={alternarTodas}
                      aria-label="Seleccionar todos los socios de esta página"
                    />
                  </TableHead>
                  <ColumnaOrdenable
                    columna="nombre"
                    activa={orden.columna === "nombre"}
                    onOrdenar={alternarOrden}
                  >
                    Socio
                  </ColumnaOrdenable>
                  <ColumnaOrdenable
                    columna="rut"
                    activa={orden.columna === "rut"}
                    onOrdenar={alternarOrden}
                  >
                    RUT
                  </ColumnaOrdenable>
                  <TableHead className="h-11 px-4 text-[0.87rem] font-medium text-muted-foreground">
                    Estado
                  </TableHead>
                  <ColumnaOrdenable
                    columna="telefono"
                    activa={orden.columna === "telefono"}
                    onOrdenar={alternarOrden}
                  >
                    Teléfono
                  </ColumnaOrdenable>
                  <TableHead className="h-11 px-4 text-[0.87rem] font-medium text-muted-foreground">
                    Dirección
                  </TableHead>
                  <TableHead className="h-11 w-12 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-[0.92rem] text-muted-foreground"
                    >
                      {busqueda
                        ? `Ningún socio coincide con «${busqueda}».`
                        : "No hay socios en esta pestaña."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibles.map((socio) => (
                    <TableRow
                      key={socio.id}
                      data-state={seleccion.has(socio.id) ? "selected" : undefined}
                    >
                      <TableCell className="w-11 py-3.5 pl-5">
                        <Checkbox
                          checked={seleccion.has(socio.id)}
                          onCheckedChange={() => alternarSeleccion(socio.id)}
                          aria-label={`Seleccionar a ${socio.nombre}`}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.72rem] font-semibold text-primary">
                            {iniciales(socio.nombre)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {socio.nombre}
                            </div>
                            {socio.numeroCliente && (
                              <div className="text-[0.78rem] tabular-nums text-muted-foreground">
                                N.º {socio.numeroCliente}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 tabular-nums text-muted-foreground">
                        {formatearRut(socio.rut)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.78rem] font-medium",
                            socio.activo
                              ? "bg-forest/10 text-forest"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {socio.activo ? (
                            <UserCheck className="size-3.5" />
                          ) : (
                            <UserX className="size-3.5" />
                          )}
                          {socio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 tabular-nums text-muted-foreground">
                        {formatearTelefono(socio.telefono)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground">
                        {socio.direccion ?? "—"}
                      </TableCell>
                      <TableCell className="w-12 py-3.5 pr-5">
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

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <p className="text-[0.87rem] text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {filtrados.length}
              </span>{" "}
              {filtrados.length === 1 ? "resultado" : "resultados"}
              {seleccion.size > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground tabular-nums">
                    {seleccion.size}
                  </span>{" "}
                  {seleccion.size === 1 ? "seleccionado" : "seleccionados"}
                </>
              )}
            </p>

            <div className="flex items-center gap-1 text-[0.87rem] text-muted-foreground">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft />
              </Button>
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground tabular-nums">
                {paginaActual}
              </span>
              <span className="px-1">de</span>
              <span className="tabular-nums">{totalPaginas}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
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
