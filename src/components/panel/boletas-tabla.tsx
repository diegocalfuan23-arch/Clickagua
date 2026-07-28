"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  anularBoleta,
  eliminarBoleta,
  guardarBoleta,
  importarBoletas,
  registrarPago,
  type ResultadoAccion,
  type ResultadoImportacion,
} from "@/app/panel/boletas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatearPeriodo, saldo } from "@/lib/boletas";
import { formatearRut } from "@/lib/formato";

type Estado = "PENDIENTE" | "PAGADA" | "VENCIDA" | "ANULADA";

export type BoletaFila = {
  id: string;
  socioId: string;
  socioNombre: string;
  socioRut: string;
  periodo: string;
  montoTotal: number;
  montoPagado: number;
  estado: Estado;
  fechaEmision: Date;
  fechaVencimiento: Date;
  lecturaAnterior: number | null;
  lecturaActual: number | null;
  consumoM3: number | null;
  observacion: string | null;
};

export type SocioOpcion = { id: string; nombre: string; rut: string };

const POR_PAGINA = 12;

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fecha = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const ESTILO_ESTADO: Record<
  Estado,
  { texto: string; clase: string; icono: typeof CheckCircle2 }
> = {
  PAGADA: {
    texto: "Pagada",
    clase: "bg-forest/10 text-forest",
    icono: CheckCircle2,
  },
  PENDIENTE: {
    texto: "Pendiente",
    clase: "bg-tertiary/15 text-tertiary",
    icono: Clock,
  },
  VENCIDA: {
    texto: "Vencida",
    clase: "bg-destructive/10 text-destructive",
    icono: AlertCircle,
  },
  ANULADA: {
    texto: "Anulada",
    clase: "bg-muted text-muted-foreground",
    icono: Ban,
  },
};

function TarjetaResumen({
  icono,
  color,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode;
  color: string;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg [&_svg]:size-4.5",
          color
        )}
      >
        {icono}
      </span>
      <div className="mt-4 text-[0.87rem] text-muted-foreground">{etiqueta}</div>
      <div className="mt-1 text-[1.6rem] leading-none font-semibold tabular-nums">
        {valor}
      </div>
    </div>
  );
}

export function BoletasTabla({
  boletas,
  socios,
  tieneTarifas,
}: {
  boletas: BoletaFila[];
  socios: SocioOpcion[];
  tieneTarifas: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState<"todas" | Estado>("todas");
  const [periodo, setPeriodo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<BoletaFila | null>(null);
  const [cobrando, setCobrando] = useState<BoletaFila | null>(null);
  const [porEliminar, setPorEliminar] = useState<BoletaFila | null>(null);
  const [importando, setImportando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const periodos = useMemo(
    () => [...new Set(boletas.map((b) => b.periodo))].sort().reverse(),
    [boletas]
  );

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return boletas.filter((b) => {
      if (pestana !== "todas" && b.estado !== pestana) return false;
      if (periodo !== "todos" && b.periodo !== periodo) return false;
      if (!termino) return true;
      return [b.socioNombre, b.socioRut, b.periodo]
        .join(" ")
        .toLowerCase()
        .includes(termino);
    });
  }, [boletas, busqueda, pestana, periodo]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  // Los totales se calculan sobre lo filtrado: si miras un período, el
  // resumen debe ser de ese período.
  const vigentes = filtradas.filter((b) => b.estado !== "ANULADA");
  const porCobrar = vigentes.reduce(
    (s, b) => s + saldo(b.montoTotal, b.montoPagado),
    0
  );
  const cobrado = vigentes.reduce((s, b) => s + b.montoPagado, 0);
  const vencidas = filtradas.filter((b) => b.estado === "VENCIDA").length;

  const pestanas: { id: "todas" | Estado; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "PENDIENTE", label: "Pendientes" },
    { id: "VENCIDA", label: "Vencidas" },
    { id: "PAGADA", label: "Pagadas" },
  ];

  function cambiarFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.35rem] font-semibold tracking-tight">Boletas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportando(true)}>
            <Upload />
            Importar CSV
          </Button>
          <Button
            onClick={() => setCreando(true)}
            disabled={socios.length === 0}
          >
            <Plus />
            Nueva boleta
          </Button>
        </div>
      </div>

      {socios.length === 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-tertiary/40 bg-tertiary/10 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-tertiary" />
          <p className="text-[0.88rem] leading-relaxed">
            <strong>Primero carga a tus socios.</strong> Una boleta siempre
            pertenece a un socio del padrón.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen
          icono={<ReceiptText />}
          color="bg-primary/10 text-primary"
          etiqueta="Boletas"
          valor={String(filtradas.length)}
        />
        <TarjetaResumen
          icono={<Coins />}
          color="bg-secondary/10 text-secondary"
          etiqueta="Por cobrar"
          valor={clp.format(porCobrar)}
        />
        <TarjetaResumen
          icono={<CheckCircle2 />}
          color="bg-forest/10 text-forest"
          etiqueta="Cobrado"
          valor={clp.format(cobrado)}
        />
        <TarjetaResumen
          icono={<AlertCircle />}
          color="bg-destructive/10 text-destructive"
          etiqueta="Vencidas"
          valor={String(vencidas)}
        />
      </div>

      {boletas.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <FileText className="size-5 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-[1rem] font-semibold">
            Aún no has emitido boletas
          </h2>
          <p className="mt-2 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted-foreground">
            Sube la planilla del período con el RUT del socio y el monto, o
            crea una boleta a mano. El bot usa estos datos para responder
            cuánto debe cada socio.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setImportando(true)}>
              <Upload />
              Importar CSV
            </Button>
            <Button
              onClick={() => setCreando(true)}
              disabled={socios.length === 0}
            >
              <Plus />
              Nueva boleta
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex gap-6 overflow-x-auto border-b border-border/60 px-5">
            {pestanas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => cambiarFiltro(() => setPestana(p.id))}
                className={cn(
                  "-mb-px shrink-0 border-b-2 py-3.5 text-[0.9rem] font-medium transition-colors",
                  pestana === p.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 p-5">
            <div className="relative min-w-60 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) =>
                  cambiarFiltro(() => setBusqueda(e.target.value))
                }
                placeholder="Buscar por socio, RUT o período…"
                aria-label="Buscar boletas"
                className="h-10 border-transparent bg-muted/60 pl-10"
              />
            </div>
            <select
              value={periodo}
              onChange={(e) => cambiarFiltro(() => setPeriodo(e.target.value))}
              aria-label="Filtrar por período"
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="todos">Todos los períodos</option>
              {periodos.map((p) => (
                <option key={p} value={p}>
                  {formatearPeriodo(p)}
                </option>
              ))}
            </select>
          </div>

          {/* TableHeader y TableRow apilan sus bordes en la misma fila: un
              solo borde suave declarado aquí gana a ambos. */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-border/50 hover:bg-transparent">
                  {[
                    "Socio",
                    "Período",
                    "Consumo",
                    "Monto",
                    "Pagado",
                    "Estado",
                    "Vence",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="h-11 px-4 text-[0.87rem] font-medium text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                  <TableHead className="h-11 w-12 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-[0.92rem] text-muted-foreground"
                    >
                      Ninguna boleta coincide con el filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibles.map((b) => {
                    const estilo = ESTILO_ESTADO[b.estado];
                    const Icono = estilo.icono;
                    const pendienteDePago = saldo(b.montoTotal, b.montoPagado);

                    return (
                      <TableRow key={b.id}>
                        <TableCell className="px-4 py-3.5">
                          <div className="font-medium">{b.socioNombre}</div>
                          <div className="text-[0.78rem] tabular-nums text-muted-foreground">
                            {formatearRut(b.socioRut)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 whitespace-nowrap">
                          {formatearPeriodo(b.periodo)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 tabular-nums text-muted-foreground">
                          {b.consumoM3 !== null ? `${b.consumoM3} m³` : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium tabular-nums">
                          {clp.format(b.montoTotal)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 tabular-nums">
                          {b.montoPagado > 0 ? (
                            <>
                              <div>{clp.format(b.montoPagado)}</div>
                              {pendienteDePago > 0 && b.estado !== "ANULADA" && (
                                <div className="text-[0.78rem] text-destructive">
                                  faltan {clp.format(pendienteDePago)}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.78rem] font-medium whitespace-nowrap",
                              estilo.clase
                            )}
                          >
                            <Icono className="size-3.5" />
                            {estilo.texto}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 tabular-nums whitespace-nowrap text-muted-foreground">
                          {fecha.format(b.fechaVencimiento)}
                        </TableCell>
                        <TableCell className="w-12 py-3.5 pr-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Acciones para la boleta de ${b.socioNombre}`}
                                >
                                  <MoreHorizontal />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setCobrando(b)}>
                                <Coins />
                                Registrar pago
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditando(b)}>
                                <Pencil />
                                Editar
                              </DropdownMenuItem>
                              {b.estado !== "ANULADA" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    iniciar(async () => {
                                      await anularBoleta(b.id);
                                    })
                                  }
                                >
                                  <Ban />
                                  Anular
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setPorEliminar(b)}
                              >
                                <Trash2 />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <p className="text-[0.87rem] text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {filtradas.length}
              </span>{" "}
              {filtradas.length === 1 ? "boleta" : "boletas"}
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
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium tabular-nums text-foreground">
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

      <BoletaDialog
        abierto={creando}
        onAbiertoChange={setCreando}
        socios={socios}
        tieneTarifas={tieneTarifas}
      />

      {editando && (
        <BoletaDialog
          abierto
          onAbiertoChange={(v) => !v && setEditando(null)}
          socios={socios}
          tieneTarifas={tieneTarifas}
          boleta={editando}
        />
      )}

      {cobrando && (
        <PagoDialog
          boleta={cobrando}
          onCerrar={() => setCobrando(null)}
        />
      )}

      <ImportarDialog abierto={importando} onAbiertoChange={setImportando} />

      <Dialog
        open={Boolean(porEliminar)}
        onOpenChange={(v) => !v && setPorEliminar(null)}
      >
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Eliminar boleta</DialogTitle>
            <DialogDescription>
              Se borrará la boleta de {porEliminar?.socioNombre} del período{" "}
              {porEliminar && formatearPeriodo(porEliminar.periodo)}. Si solo
              quieres dejarla sin efecto conservando el registro, usa Anular.
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
                iniciar(async () => {
                  if (porEliminar) await eliminarBoleta(porEliminar.id);
                  setPorEliminar(null);
                })
              }
            >
              {pendiente ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BoletaDialog({
  abierto,
  onAbiertoChange,
  socios,
  tieneTarifas,
  boleta,
}: {
  abierto: boolean;
  onAbiertoChange: (v: boolean) => void;
  socios: SocioOpcion[];
  tieneTarifas: boolean;
  boleta?: BoletaFila;
}) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(async (prev, formData) => {
    const r = await guardarBoleta(prev, formData);
    if (r.ok) onAbiertoChange(false);
    return r;
  }, null);

  const paraInput = (d: Date) => new Date(d).toISOString().slice(0, 10);

  // El reloj se lee una vez al montar, no en cada render: leerlo durante el
  // render hace que los valores por defecto del formulario cambien solos.
  const [hoy] = useState(() => new Date());
  const en30 = new Date(hoy.getTime() + 30 * 86_400_000);

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {boleta ? "Editar boleta" : "Nueva boleta"}
          </DialogTitle>
          <DialogDescription>
            {tieneTarifas
              ? "Ingresa las lecturas del medidor para calcular el monto, o escríbelo directamente."
              : "Ingresa el monto de la boleta."}
          </DialogDescription>
        </DialogHeader>

        <form action={accion} className="flex flex-col gap-4">
          {boleta && <input type="hidden" name="boletaId" value={boleta.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="socioId">Socio</Label>
            <select
              id="socioId"
              name="socioId"
              defaultValue={boleta?.socioId ?? ""}
              required
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Elige un socio…
              </option>
              {socios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {formatearRut(s.rut)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                name="periodo"
                defaultValue={boleta?.periodo}
                placeholder="2026-07"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fechaEmision">Emisión</Label>
              <Input
                id="fechaEmision"
                name="fechaEmision"
                type="date"
                defaultValue={paraInput(boleta?.fechaEmision ?? hoy)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fechaVencimiento">Vence</Label>
              <Input
                id="fechaVencimiento"
                name="fechaVencimiento"
                type="date"
                defaultValue={paraInput(boleta?.fechaVencimiento ?? en30)}
                required
              />
            </div>
          </div>

          {tieneTarifas && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturaAnterior">Lectura anterior</Label>
                <Input
                  id="lecturaAnterior"
                  name="lecturaAnterior"
                  inputMode="numeric"
                  defaultValue={boleta?.lecturaAnterior ?? ""}
                  placeholder="1200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturaActual">Lectura actual</Label>
                <Input
                  id="lecturaActual"
                  name="lecturaActual"
                  inputMode="numeric"
                  defaultValue={boleta?.lecturaActual ?? ""}
                  placeholder="1215"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="montoTotal">
              Monto {tieneTarifas && "(si no usas lecturas)"}
            </Label>
            <Input
              id="montoTotal"
              name="montoTotal"
              inputMode="numeric"
              defaultValue={boleta?.montoTotal ?? ""}
              placeholder="9250"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacion">Observación</Label>
            <Textarea
              id="observacion"
              name="observacion"
              rows={2}
              maxLength={300}
              defaultValue={boleta?.observacion ?? ""}
            />
          </div>

          {estado && !estado.ok && (
            <p className="text-[0.88rem] text-destructive">{estado.error}</p>
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
              {boleta ? "Guardar cambios" : "Crear boleta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PagoDialog({
  boleta,
  onCerrar,
}: {
  boleta: BoletaFila;
  onCerrar: () => void;
}) {
  const [monto, setMonto] = useState(String(boleta.montoPagado || ""));
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const pendienteDePago = saldo(boleta.montoTotal, boleta.montoPagado);

  return (
    <Dialog open onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {boleta.socioNombre} · {formatearPeriodo(boleta.periodo)} ·{" "}
            {clp.format(boleta.montoTotal)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monto">Monto pagado en total</Label>
            <Input
              id="monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              autoFocus
            />
            <p className="text-[0.82rem] text-muted-foreground">
              {pendienteDePago > 0
                ? `Quedan ${clp.format(pendienteDePago)} por pagar.`
                : "Esta boleta está pagada."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonto(String(boleta.montoTotal))}
            >
              Pagó el total
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMonto("0")}>
              Sin pago
            </Button>
          </div>

          {error && <p className="text-[0.88rem] text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await registrarPago(boleta.id, Number(monto || 0));
                if (r.ok) onCerrar();
                else setError(r.error);
              })
            }
          >
            {pendiente && <Loader2 className="animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportarDialog({
  abierto,
  onAbiertoChange,
}: {
  abierto: boolean;
  onAbiertoChange: (v: boolean) => void;
}) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoImportacion | null,
    FormData
  >(importarBoletas, null);

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Importar boletas</DialogTitle>
          <DialogDescription>
            Sube la planilla del período en formato CSV.
          </DialogDescription>
        </DialogHeader>

        <form action={accion} className="flex flex-col gap-4">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-[0.85rem]">
            <p className="font-medium">Columnas del archivo</p>
            <p className="mt-1.5 text-muted-foreground">
              Obligatorias: <code className="font-mono">rut</code>,{" "}
              <code className="font-mono">periodo</code>
            </p>
            <p className="mt-1 text-muted-foreground">
              Opcionales: <code className="font-mono">monto</code>,{" "}
              <code className="font-mono">vencimiento</code>,{" "}
              <code className="font-mono">emision</code>,{" "}
              <code className="font-mono">lecturaAnterior</code>,{" "}
              <code className="font-mono">lecturaActual</code>
            </p>
            <p className="mt-2.5 text-muted-foreground">
              Si vienen las dos lecturas, el monto se calcula con tus tarifas.
              Reimportar el mismo período actualiza las boletas en vez de
              duplicarlas, y no borra los pagos ya registrados.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="archivo">Archivo CSV</Label>
            <Input
              id="archivo"
              name="archivo"
              type="file"
              accept=".csv,text/csv"
              required
            />
          </div>

          {estado && !estado.ok && (
            <p className="text-[0.88rem] text-destructive">{estado.error}</p>
          )}

          {estado?.ok && (
            <div className="rounded-lg border border-forest/30 bg-forest/5 p-4 text-[0.88rem]">
              <p className="font-medium text-forest">
                {estado.creadas} creadas · {estado.actualizadas} actualizadas
              </p>
              {estado.omitidas.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground">
                    {estado.omitidas.length} filas omitidas
                  </summary>
                  <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto text-[0.82rem] text-muted-foreground">
                    {estado.omitidas.map((o) => (
                      <li key={o.linea}>
                        Línea {o.linea}: {o.motivo}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAbiertoChange(false)}
            >
              {estado?.ok ? "Cerrar" : "Cancelar"}
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente && <Loader2 className="animate-spin" />}
              Importar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
