"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Droplets,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  alternarPublicado,
  crearAviso,
  eliminarAviso,
  guardarSitio,
  type ResultadoAccion,
} from "@/app/panel/sitio/actions";
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
import { cn } from "@/lib/utils";

export type DatosEditor = {
  slug: string | null;
  sitioPublicado: boolean;
  sitioDescripcion: string | null;
  horarioAtencion: string | null;
  tarifaCargoFijo: number | null;
  tarifaMetroCubico: number | null;
  infoPago: string | null;
};

export type AvisoEditor = {
  id: string;
  tipo: "CORTE" | "MANTENCION" | "NOTICIA";
  titulo: string;
  sectores: string | null;
  inicia: Date | null;
  termina: Date | null;
};

const ETIQUETA_TIPO = {
  CORTE: { texto: "Corte", icono: AlertTriangle, color: "text-destructive" },
  MANTENCION: { texto: "Mantención", icono: Wrench, color: "text-tertiary" },
  NOTICIA: { texto: "Noticia", icono: Droplets, color: "text-primary" },
} as const;

const fechaCorta = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function Tarjeta({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2 className="text-[1.05rem] font-semibold">{titulo}</h2>
      {descripcion && (
        <p className="mt-0.5 text-[0.87rem] text-muted-foreground">
          {descripcion}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SitioEditor({
  datos,
  avisos,
  dominioRaiz,
  sugerenciaSlug,
}: {
  datos: DatosEditor;
  avisos: AvisoEditor[];
  dominioRaiz: string;
  sugerenciaSlug: string;
}) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(guardarSitio, null);

  const [slug, setSlug] = useState(datos.slug ?? sugerenciaSlug);
  const [copiado, setCopiado] = useState(false);
  const [nuevoAviso, setNuevoAviso] = useState(false);
  const [publicando, iniciarPublicar] = useTransition();
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);

  const url = `https://${slug || sugerenciaSlug}.${dominioRaiz}`;

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight">
            Sitio público
          </h1>
          <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
            La página web de tu comité. Se arma sola con los datos que ya
            tienes cargados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {datos.sitioPublicado && datos.slug && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[0.87rem] font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              Ver sitio
            </a>
          )}
          <Button
            variant={datos.sitioPublicado ? "outline" : "default"}
            disabled={publicando}
            onClick={() =>
              iniciarPublicar(async () => {
                const r = await alternarPublicado(!datos.sitioPublicado);
                setErrorPublicar(r.ok ? null : r.error);
              })
            }
          >
            {publicando && <Loader2 className="animate-spin" />}
            {datos.sitioPublicado ? "Despublicar" : "Publicar sitio"}
          </Button>
        </div>
      </div>

      {errorPublicar && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive">
          {errorPublicar}
        </p>
      )}

      <div
        className={cn(
          "flex flex-wrap items-center gap-2.5 rounded-xl border px-4 py-3 text-[0.9rem]",
          datos.sitioPublicado
            ? "border-forest/30 bg-forest/5"
            : "border-border/60 bg-muted/40"
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            datos.sitioPublicado ? "bg-forest" : "bg-muted-foreground/50"
          )}
        />
        <span className="font-medium">
          {datos.sitioPublicado ? "Publicado" : "Sin publicar"}
        </span>
        <span className="text-muted-foreground">
          {datos.sitioPublicado
            ? "Cualquiera puede visitarlo."
            : "Solo tú lo ves. Publícalo cuando esté listo."}
        </span>
      </div>

      <form action={accion} className="flex flex-col gap-5">
        <Tarjeta
          titulo="Dirección web"
          descripcion="Así encontrarán tu comité en internet."
        >
          <Label htmlFor="slug">Dirección</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .slice(0, 40)
                  )
                }
                required
                className="border-0 focus-visible:ring-0 focus-visible:border-transparent"
              />
              <span className="shrink-0 border-l border-input bg-muted px-3 py-2 text-[0.87rem] text-muted-foreground">
                .{dominioRaiz}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={copiar}
              aria-label="Copiar dirección"
            >
              {copiado ? <Check className="text-forest" /> : <Copy />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[0.85rem] text-muted-foreground">
            <Globe className="size-3.5" />
            {url}
          </p>
        </Tarjeta>

        <Tarjeta
          titulo="Presentación"
          descripcion="Un párrafo breve sobre el comité y su horario de atención."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sitioDescripcion">Descripción</Label>
              <Textarea
                id="sitioDescripcion"
                name="sitioDescripcion"
                rows={3}
                maxLength={500}
                defaultValue={datos.sitioDescripcion ?? ""}
                placeholder="Somos el comité de agua potable rural que abastece a las familias de…"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Si lo dejas vacío usamos un texto por defecto con el nombre de
                tu comuna.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="horarioAtencion">Horario de atención</Label>
              <Textarea
                id="horarioAtencion"
                name="horarioAtencion"
                rows={2}
                maxLength={300}
                defaultValue={datos.horarioAtencion ?? ""}
                placeholder={"Lunes a viernes, 9:00 a 14:00\nSábados, 9:00 a 12:00"}
              />
            </div>
          </div>
        </Tarjeta>

        <Tarjeta
          titulo="Tarifas y pago"
          descripcion="Publicarlas evita que pregunten lo mismo por teléfono."
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarifaCargoFijo">Cargo fijo</Label>
                <Input
                  id="tarifaCargoFijo"
                  name="tarifaCargoFijo"
                  inputMode="numeric"
                  defaultValue={datos.tarifaCargoFijo ?? ""}
                  placeholder="2500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarifaMetroCubico">Valor del m³</Label>
                <Input
                  id="tarifaMetroCubico"
                  name="tarifaMetroCubico"
                  inputMode="numeric"
                  defaultValue={datos.tarifaMetroCubico ?? ""}
                  placeholder="450"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="infoPago">Cómo y dónde pagar</Label>
              <Textarea
                id="infoPago"
                name="infoPago"
                rows={3}
                maxLength={1000}
                defaultValue={datos.infoPago ?? ""}
                placeholder={"En la oficina del comité, en efectivo.\nTransferencia: Cuenta Vista 1234567, Banco Estado."}
              />
            </div>
          </div>
        </Tarjeta>

        {estado && !estado.ok && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive">
            {estado.error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Loader2 className="animate-spin" />}
            Guardar cambios
          </Button>
          {estado?.ok && (
            <span className="flex items-center gap-1.5 text-[0.88rem] text-forest">
              <Check className="size-4" />
              Guardado
            </span>
          )}
        </div>
      </form>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[1.05rem] font-semibold">Avisos</h2>
            <p className="mt-0.5 text-[0.87rem] text-muted-foreground">
              Cortes, mantenciones y noticias. Aparecen primero en tu sitio.
            </p>
          </div>
          <Button variant="outline" onClick={() => setNuevoAviso(true)}>
            <Plus />
            Nuevo aviso
          </Button>
        </div>

        <div className="mt-5">
          {avisos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[0.9rem] text-muted-foreground">
              Todavía no has publicado avisos.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {avisos.map((aviso) => {
                const meta = ETIQUETA_TIPO[aviso.tipo];
                const Icono = meta.icono;

                return (
                  <div
                    key={aviso.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Icono className={cn("size-4 shrink-0", meta.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.92rem] font-medium">
                        {aviso.titulo}
                      </div>
                      <div className="truncate text-[0.82rem] text-muted-foreground">
                        {meta.texto}
                        {aviso.inicia && ` · ${fechaCorta.format(aviso.inicia)}`}
                        {aviso.sectores && ` · ${aviso.sectores}`}
                      </div>
                    </div>
                    <FormularioEliminar id={aviso.id} titulo={aviso.titulo} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AvisoDialog abierto={nuevoAviso} onAbiertoChange={setNuevoAviso} />
    </>
  );
}

function FormularioEliminar({ id, titulo }: { id: string; titulo: string }) {
  const [pendiente, iniciar] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pendiente}
      aria-label={`Eliminar aviso ${titulo}`}
      onClick={() => iniciar(async () => void (await eliminarAviso(id)))}
    >
      {pendiente ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}

function AvisoDialog({
  abierto,
  onAbiertoChange,
}: {
  abierto: boolean;
  onAbiertoChange: (v: boolean) => void;
}) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(async (prev, formData) => {
    const r = await crearAviso(prev, formData);
    if (r.ok) onAbiertoChange(false);
    return r;
  }, null);

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nuevo aviso</DialogTitle>
          <DialogDescription>
            Se publica de inmediato en tu sitio.
          </DialogDescription>
        </DialogHeader>

        <form action={accion} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              defaultValue="CORTE"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="CORTE">Corte de agua</option>
              <option value="MANTENCION">Mantención</option>
              <option value="NOTICIA">Noticia</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              maxLength={160}
              placeholder="Corte programado por reparación de matriz"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sectores">Sectores afectados</Label>
            <Input
              id="sectores"
              name="sectores"
              maxLength={300}
              placeholder="Sector norte, camino a Pitrelahué"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inicia">Comienza</Label>
              <Input id="inicia" name="inicia" type="datetime-local" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="termina">Termina</Label>
              <Input id="termina" name="termina" type="datetime-local" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cuerpo">Detalle</Label>
            <Textarea
              id="cuerpo"
              name="cuerpo"
              rows={3}
              maxLength={1000}
              placeholder="Recomendamos almacenar agua durante la mañana."
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
              Publicar aviso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
