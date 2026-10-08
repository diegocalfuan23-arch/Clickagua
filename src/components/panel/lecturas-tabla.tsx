"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Loader2,
  Plus,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  aprobarLectura,
  rechazarLectura,
  registrarLectura,
  type ResultadoAccion,
} from "@/app/panel/lecturas/actions";
import { Button, buttonVariants } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatearPeriodo } from "@/lib/boletas";
import { SocioBuscador, type OpcionSocio } from "@/components/panel/socio-buscador";

type Estado = "PENDIENTE" | "APROBADA" | "RECHAZADA";

export type LecturaFila = {
  id: string;
  socio: string;
  rut: string;
  periodo: string;
  valor: number;
  observacion: string | null;
  estado: Estado;
  motivoRechazo: string | null;
  registradaPor: string | null;
  createdAt: Date;
};

export type SocioOpcion = OpcionSocio;

const POR_PAGINA = 12;

const fechaHora = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const ESTILO_ESTADO: Record<
  Estado,
  { texto: string; clase: string; icono: typeof Clock }
> = {
  PENDIENTE: {
    texto: "Por revisar",
    clase: "bg-tertiary/15 text-tertiary",
    icono: Clock,
  },
  APROBADA: {
    texto: "Aprobada",
    clase: "bg-forest/10 text-forest",
    icono: CheckCircle2,
  },
  RECHAZADA: {
    texto: "Rechazada",
    clase: "bg-destructive/10 text-destructive",
    icono: XCircle,
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
  valor: number;
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

export function LecturasTabla({
  lecturas,
  socios,
}: {
  lecturas: LecturaFila[];
  socios: SocioOpcion[];
}) {
  const router = useRouter();
  const porRevisar = lecturas.filter((l) => l.estado === "PENDIENTE").length;

  const [busqueda, setBusqueda] = useState("");
  // Lo primero que necesita la directiva es lo que espera su revisión.
  const [pestana, setPestana] = useState<"todas" | Estado>(
    porRevisar > 0 ? "PENDIENTE" : "todas"
  );
  const [periodo, setPeriodo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [creando, setCreando] = useState(false);
  const [rechazando, setRechazando] = useState<LecturaFila | null>(null);

  const periodos = useMemo(
    () => [...new Set(lecturas.map((l) => l.periodo))].sort().reverse(),
    [lecturas]
  );

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return lecturas.filter((l) => {
      if (pestana !== "todas" && l.estado !== pestana) return false;
      if (periodo !== "todos" && l.periodo !== periodo) return false;
      if (!termino) return true;
      return [l.socio, l.rut, l.periodo].join(" ").toLowerCase().includes(termino);
    });
  }, [lecturas, busqueda, pestana, periodo]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  const aprobadas = lecturas.filter((l) => l.estado === "APROBADA").length;
  const rechazadas = lecturas.filter((l) => l.estado === "RECHAZADA").length;

  const pestanas: { id: "todas" | Estado; label: string; cuenta?: number }[] = [
    { id: "todas", label: "Todas" },
    { id: "PENDIENTE", label: "Por revisar", cuenta: porRevisar },
    { id: "APROBADA", label: "Aprobadas" },
    { id: "RECHAZADA", label: "Rechazadas" },
  ];

  function cambiarFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight">
            Lecturas
          </h1>
          <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
            Cada lectura aprobada genera o actualiza la boleta del período.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/panel/tecnicos"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Users />
            Técnicos
          </Link>
          <Button onClick={() => setCreando(true)} disabled={socios.length === 0}>
            <Plus />
            Nueva lectura
          </Button>
        </div>
      </div>

      {porRevisar > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-tertiary/40 bg-tertiary/10 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-tertiary" />
          <p className="text-[0.88rem] leading-relaxed">
            <strong>
              {porRevisar}{" "}
              {porRevisar === 1
                ? "lectura espera tu revisión."
                : "lecturas esperan tu revisión."}
            </strong>{" "}
            Hasta que no se aprueben, no se genera la boleta del socio.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaResumen
          icono={<Clock />}
          color="bg-tertiary/15 text-tertiary"
          etiqueta="Por revisar"
          valor={porRevisar}
        />
        <TarjetaResumen
          icono={<CheckCircle2 />}
          color="bg-forest/10 text-forest"
          etiqueta="Aprobadas"
          valor={aprobadas}
        />
        <TarjetaResumen
          icono={<XCircle />}
          color="bg-destructive/10 text-destructive"
          etiqueta="Rechazadas"
          valor={rechazadas}
        />
      </div>

      {lecturas.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Droplets className="size-5 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-[1rem] font-semibold">
            Aún no hay lecturas
          </h2>
          <p className="mt-2 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted-foreground">
            Los técnicos cargan las lecturas desde terreno y llegan aquí para
            tu revisión. También puedes cargar una tú misma.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/panel/tecnicos"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Users />
              Invitar técnico
            </Link>
            <Button onClick={() => setCreando(true)} disabled={socios.length === 0}>
              <Plus />
              Nueva lectura
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
                  "-mb-px flex shrink-0 items-center gap-2 border-b-2 py-3.5 text-[0.9rem] font-medium transition-colors",
                  pestana === p.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
                {p.cuenta !== undefined && p.cuenta > 0 && (
                  <span className="rounded-full bg-tertiary/20 px-1.5 text-[0.72rem] font-semibold tabular-nums text-tertiary">
                    {p.cuenta}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 p-5">
            <div className="relative min-w-60 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => cambiarFiltro(() => setBusqueda(e.target.value))}
                placeholder="Buscar por socio, RUT o período…"
                aria-label="Buscar lecturas"
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-border/50 hover:bg-transparent">
                  {["Socio", "Período", "Lectura", "Registrada por", "Estado"].map(
                    (h) => (
                      <TableHead
                        key={h}
                        className="h-11 px-4 text-[0.87rem] font-medium text-muted-foreground"
                      >
                        {h}
                      </TableHead>
                    )
                  )}
                  <TableHead className="h-11 pr-5 text-right text-[0.87rem] font-medium text-muted-foreground">
                    Acción
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-[0.92rem] text-muted-foreground"
                    >
                      Ninguna lectura coincide con el filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibles.map((l) => (
                    <FilaLectura
                      key={l.id}
                      lectura={l}
                      onRechazar={() => setRechazando(l)}
                      onAprobada={() => router.refresh()}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <p className="text-[0.87rem] text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {filtradas.length}
              </span>{" "}
              {filtradas.length === 1 ? "lectura" : "lecturas"}
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

      <NuevaLecturaDialog
        abierto={creando}
        onAbiertoChange={setCreando}
        socios={socios}
        onRegistrada={() => router.refresh()}
      />

      <RechazarDialog
        lectura={rechazando}
        onOpenChange={(abierto) => !abierto && setRechazando(null)}
        onRechazada={() => router.refresh()}
      />
    </>
  );
}

function FilaLectura({
  lectura: l,
  onRechazar,
  onAprobada,
}: {
  lectura: LecturaFila;
  onRechazar: () => void;
  onAprobada: () => void;
}) {
  const [aprobando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const estilo = ESTILO_ESTADO[l.estado];
  const Icono = estilo.icono;

  return (
    <TableRow>
      <TableCell className="px-4 py-3.5">
        <div className="font-medium">{l.socio}</div>
        <div className="text-[0.78rem] tabular-nums text-muted-foreground">
          {l.rut}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3.5 whitespace-nowrap">
        {formatearPeriodo(l.periodo)}
      </TableCell>
      <TableCell className="px-4 py-3.5 tabular-nums">
        <div className="font-medium">{l.valor}</div>
        {l.observacion && (
          <div
            title={l.observacion}
            className="max-w-48 truncate text-[0.78rem] text-muted-foreground"
          >
            &ldquo;{l.observacion}&rdquo;
          </div>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div>{l.registradaPor ?? "—"}</div>
        <div className="text-[0.78rem] text-muted-foreground">
          {fechaHora.format(l.createdAt)}
        </div>
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
        {l.estado === "RECHAZADA" && l.motivoRechazo && (
          <div
            title={l.motivoRechazo}
            className="mt-1 max-w-52 truncate text-[0.78rem] text-muted-foreground"
          >
            {l.motivoRechazo}
          </div>
        )}
      </TableCell>
      <TableCell className="py-3.5 pr-5 text-right">
        {l.estado === "PENDIENTE" ? (
          <div className="flex items-center justify-end gap-2">
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
                iniciar(async () => {
                  setError(null);
                  const r = await aprobarLectura(l.id);
                  if (r.ok) onAprobada();
                  else setError(r.error);
                })
              }
            >
              {aprobando ? <Loader2 className="animate-spin" /> : <Check />}
              Aprobar
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {error && (
          <p className="mt-1 text-[0.78rem] text-destructive">{error}</p>
        )}
      </TableCell>
    </TableRow>
  );
}

function NuevaLecturaDialog({
  abierto,
  onAbiertoChange,
  socios,
  onRegistrada,
}: {
  abierto: boolean;
  onAbiertoChange: (v: boolean) => void;
  socios: SocioOpcion[];
  onRegistrada: () => void;
}) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(async (prev, formData) => {
    const r = await registrarLectura(prev, formData);
    if (r.ok) {
      onAbiertoChange(false);
      onRegistrada();
    }
    return r;
  }, null);

  // El reloj se lee una vez al montar, no en cada render.
  const [hoy] = useState(() => new Date());
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Nueva lectura</DialogTitle>
          <DialogDescription>
            Queda por revisar hasta que la apruebes; recién ahí se genera la
            boleta.
          </DialogDescription>
        </DialogHeader>

        <form action={accion} className="flex min-w-0 flex-col gap-4">
          <SocioBuscador socios={socios} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-periodo">Período</Label>
              <Input
                id="nl-periodo"
                name="periodo"
                defaultValue={periodoActual}
                placeholder="2026-07"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-valor">Lectura del medidor</Label>
              <Input
                id="nl-valor"
                name="valor"
                inputMode="numeric"
                placeholder="1250"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nl-observacion">Observación (opcional)</Label>
            <Textarea
              id="nl-observacion"
              name="observacion"
              rows={2}
              maxLength={300}
              placeholder="Medidor con humedad, difícil de leer con precisión…"
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
              Registrar lectura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RechazarDialog({
  lectura,
  onOpenChange,
  onRechazada,
}: {
  lectura: LecturaFila | null;
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
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Rechazar lectura</DialogTitle>
          <DialogDescription>
            {lectura &&
              `${lectura.socio} · ${formatearPeriodo(lectura.periodo)} · lectura ${lectura.valor}`}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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
