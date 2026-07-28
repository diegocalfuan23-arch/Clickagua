import {
  AlertTriangle,
  Clock,
  Droplets,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Wrench,
} from "lucide-react";
import { formatearTelefono } from "@/lib/formato";

export type DatosSitio = {
  nombre: string;
  comuna: string;
  region: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  sitioDescripcion: string | null;
  horarioAtencion: string | null;
  tarifaCargoFijo: number | null;
  tarifaMetroCubico: number | null;
  infoPago: string | null;
};

export type AvisoSitio = {
  id: string;
  tipo: "CORTE" | "MANTENCION" | "NOTICIA";
  titulo: string;
  cuerpo: string | null;
  sectores: string | null;
  inicia: Date | null;
  termina: Date | null;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fechaHora = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const ESTILO_AVISO = {
  CORTE: {
    icono: AlertTriangle,
    clase: "border-destructive/30 bg-destructive/5",
    color: "text-destructive",
    etiqueta: "Corte de agua",
  },
  MANTENCION: {
    icono: Wrench,
    clase: "border-tertiary/40 bg-tertiary/10",
    color: "text-tertiary",
    etiqueta: "Mantención",
  },
  NOTICIA: {
    icono: Droplets,
    clase: "border-primary/25 bg-primary/5",
    color: "text-primary",
    etiqueta: "Noticia",
  },
} as const;

function rangoFechas(inicia: Date | null, termina: Date | null) {
  if (!inicia) return null;
  if (!termina) return `Desde el ${fechaHora.format(inicia)}`;
  return `${fechaHora.format(inicia)} — ${fechaHora.format(termina)}`;
}

export function SitioApr({
  apr,
  avisos,
}: {
  apr: DatosSitio;
  avisos: AvisoSitio[];
}) {
  const whatsapp = apr.telefono?.replace(/[^0-9]/g, "");
  const hayTarifas =
    apr.tarifaCargoFijo !== null || apr.tarifaMetroCubico !== null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Droplets className="size-5 text-primary" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold">{apr.nombre}</div>
            <div className="text-[0.8rem] text-muted-foreground">
              {apr.comuna}
              {apr.region && `, ${apr.region}`}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section>
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight sm:text-[2.5rem]">
            {apr.nombre}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[1.05rem] leading-relaxed text-muted-foreground">
            {apr.sitioDescripcion ??
              `Comité de Agua Potable Rural de ${apr.comuna}. Aquí encuentras nuestros datos de contacto, avisos de corte y la información de pago.`}
          </p>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[0.95rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageCircle className="size-4" />
              Consulta tu cuenta por WhatsApp
            </a>
          )}
        </section>

        {avisos.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[1.25rem] font-semibold">Avisos</h2>
            <div className="mt-4 flex flex-col gap-3">
              {avisos.map((aviso) => {
                const estilo = ESTILO_AVISO[aviso.tipo];
                const Icono = estilo.icono;
                const rango = rangoFechas(aviso.inicia, aviso.termina);

                return (
                  <article
                    key={aviso.id}
                    className={`rounded-xl border p-5 ${estilo.clase}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icono className={`size-4 ${estilo.color}`} />
                      <span
                        className={`text-[0.78rem] font-semibold uppercase tracking-wide ${estilo.color}`}
                      >
                        {estilo.etiqueta}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[1.05rem] font-semibold">
                      {aviso.titulo}
                    </h3>
                    {rango && (
                      <p className="mt-1 text-[0.88rem] font-medium text-muted-foreground">
                        {rango}
                      </p>
                    )}
                    {aviso.sectores && (
                      <p className="mt-1 text-[0.88rem] text-muted-foreground">
                        Sectores: {aviso.sectores}
                      </p>
                    )}
                    {aviso.cuerpo && (
                      <p className="mt-2 text-[0.93rem] leading-relaxed text-muted-foreground">
                        {aviso.cuerpo}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-border/60 p-6">
            <h2 className="text-[1.15rem] font-semibold">Contacto</h2>
            <dl className="mt-4 flex flex-col gap-3.5 text-[0.93rem]">
              {apr.direccion && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd>{apr.direccion}</dd>
                </div>
              )}
              {apr.telefono && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd className="tabular-nums">
                    {formatearTelefono(apr.telefono)}
                  </dd>
                </div>
              )}
              {apr.email && (
                <div className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd className="break-all">{apr.email}</dd>
                </div>
              )}
              {apr.horarioAtencion && (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd className="whitespace-pre-line">{apr.horarioAtencion}</dd>
                </div>
              )}
            </dl>
          </section>

          {(hayTarifas || apr.infoPago) && (
            <section className="rounded-xl border border-border/60 p-6">
              <h2 className="text-[1.15rem] font-semibold">Tarifas y pago</h2>

              {hayTarifas && (
                <dl className="mt-4 flex flex-col gap-2.5 text-[0.93rem]">
                  {apr.tarifaCargoFijo !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Cargo fijo</dt>
                      <dd className="font-medium tabular-nums">
                        {clp.format(apr.tarifaCargoFijo)}
                      </dd>
                    </div>
                  )}
                  {apr.tarifaMetroCubico !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">
                        Metro cúbico (m³)
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {clp.format(apr.tarifaMetroCubico)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {apr.infoPago && (
                <p className="mt-4 border-t border-border/60 pt-4 text-[0.93rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                  {apr.infoPago}
                </p>
              )}
            </section>
          )}
        </div>
      </main>

      <footer className="mt-8 border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[0.85rem] text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {apr.nombre}
          </span>
          <span>
            Sitio creado con{" "}
            <a
              href="https://clickagua.com"
              className="font-medium text-primary hover:underline"
            >
              ClickAgua
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
