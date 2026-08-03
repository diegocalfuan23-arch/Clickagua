import {
  AlertTriangle,
  Clock,
  Droplet,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Wrench,
} from "lucide-react";
import { formatearTelefono } from "@/lib/formato";
import { AsistenteComite } from "@/components/sitio/asistente-comite";

/*
  THESIS: la página como el letrero al borde del camino — bloques sólidos
  de identidad, alto contraste, un dato por panel, hecha para leerse rápido
  y sin ambigüedad, no para explorarse.
  OWN-WORLD: índigo pleno (#3607F2) como bloque de identidad y navegación,
  lima (#C3F207) como acento de atención sobre índigo, negro/blanco puro
  para el resto; Space Grotesk ancha en mayúsculas para título y etiquetas,
  bordes gruesos de 2-3px en vez de sombras, iconos de trazo grueso.
  STORY: el socio ve de inmediato de qué comité es el sitio y si hay un
  corte de agua; confía en que es información oficial, no un experimento.
  FIRST VIEWPORT: bloque de identidad índigo de ancho completo (nombre del
  comité como nombre de ruta) con el estado de servicio como el dato más
  grande de la página, seguido por el aviso activo si existe.
  FORM: Señalética Vial Rural, candidato 4/7, seed f9bb32f6.
  FINISH: unreviewed and undocumented is unfinished; this build ends with
  the finish review, the verdict, and DESIGN.md.
*/

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
    etiqueta: "Corte de agua",
    clase: "bg-[#1a1a1a] text-white",
    acento: "bg-[#C3F207] text-[#1a1a1a]",
  },
  MANTENCION: {
    icono: Wrench,
    etiqueta: "Mantención",
    clase: "bg-[#1a1a1a] text-white",
    acento: "bg-[#C3F207] text-[#1a1a1a]",
  },
  NOTICIA: {
    icono: Droplet,
    etiqueta: "Noticia",
    clase: "border-[3px] border-[#1a1a1a] bg-white text-[#1a1a1a]",
    acento: "bg-primary text-white",
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
  slug,
  dominio,
}: {
  apr: DatosSitio;
  avisos: AvisoSitio[];
  slug?: string;
  dominio?: string;
}) {
  const whatsapp = apr.telefono?.replace(/[^0-9]/g, "");
  const hayTarifas =
    apr.tarifaCargoFijo !== null || apr.tarifaMetroCubico !== null;
  const corteActivo = avisos.find((a) => a.tipo === "CORTE");

  return (
    <div
      className="min-h-screen bg-white text-[#1a1a1a]"
      style={{ fontFamily: "var(--font-sitio-display), var(--font-sans)" }}
    >
      {/* Franja de identidad: el nombre del comité como si fuera el nombre
          de una ruta en un letrero caminero. Bloque sólido, sin degradés. */}
      <header className="bg-primary text-white">
        <div className="mx-auto max-w-4xl px-6 py-7 sm:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md border-[3px] border-white">
              <Droplet className="size-5" fill="white" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[1.35rem] leading-tight font-bold tracking-tight uppercase sm:text-[1.6rem]">
                {apr.nombre}
              </div>
              <div className="text-[0.85rem] font-medium text-white/75 uppercase tracking-wide">
                {apr.comuna}
                {apr.region && ` · ${apr.region}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Estado del servicio: el dato más grande de la página, como un
          panel de estado en una ruta. Verde si no hay corte reportado. */}
      <div
        className={
          corteActivo
            ? "bg-[#1a1a1a] text-white"
            : "bg-forest text-forest-foreground"
        }
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4 sm:px-8">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-md border-[3px] ${
              corteActivo ? "border-[#C3F207]" : "border-white/70"
            }`}
          >
            <AlertTriangle
              className={`size-4.5 ${corteActivo ? "text-[#C3F207]" : "text-white"}`}
            />
          </span>
          <p className="text-[0.98rem] font-bold uppercase tracking-wide sm:text-[1.05rem]">
            {corteActivo
              ? "Corte de agua programado — revisa el detalle abajo"
              : "Servicio normal, sin cortes reportados"}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
        <section>
          <p className="max-w-[58ch] text-[1.1rem] leading-relaxed font-medium text-[#1a1a1a]/85">
            {apr.sitioDescripcion ??
              `Comité de Agua Potable Rural de ${apr.comuna}. Aquí encuentras nuestros datos de contacto, avisos de corte y la información de pago.`}
          </p>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 rounded-md border-[3px] border-[#1a1a1a] bg-[#C3F207] px-6 py-3.5 text-[1rem] font-bold text-[#1a1a1a] uppercase tracking-wide transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="size-5" />
              Consulta tu cuenta por WhatsApp
            </a>
          )}
        </section>

        {avisos.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[0.85rem] font-bold tracking-[0.08em] text-[#1a1a1a]/70 uppercase">
              Avisos vigentes
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {avisos.map((aviso) => {
                const estilo = ESTILO_AVISO[aviso.tipo];
                const Icono = estilo.icono;
                const rango = rangoFechas(aviso.inicia, aviso.termina);

                return (
                  <article
                    key={aviso.id}
                    className={`rounded-md p-5 sm:p-6 ${estilo.clase}`}
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[0.72rem] font-bold tracking-wide uppercase ${estilo.acento}`}
                    >
                      <Icono className="size-3.5" />
                      {estilo.etiqueta}
                    </span>
                    <h3 className="mt-3 text-[1.2rem] leading-snug font-bold">
                      {aviso.titulo}
                    </h3>
                    {rango && (
                      <p className="mt-1.5 text-[0.92rem] font-semibold opacity-80">
                        {rango}
                      </p>
                    )}
                    {aviso.sectores && (
                      <p className="mt-1 text-[0.92rem] opacity-80">
                        Sectores: {aviso.sectores}
                      </p>
                    )}
                    {aviso.cuerpo && (
                      <p className="mt-3 max-w-[65ch] text-[0.95rem] leading-relaxed opacity-90">
                        {aviso.cuerpo}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <section className="rounded-md border-[3px] border-[#1a1a1a] p-6">
            <h2 className="text-[0.85rem] font-bold tracking-[0.08em] text-[#1a1a1a]/70 uppercase">
              Contacto
            </h2>
            <dl className="mt-4 flex flex-col gap-4 text-[0.98rem]">
              {apr.direccion && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                  <dd className="font-medium">{apr.direccion}</dd>
                </div>
              )}
              {apr.telefono && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                  <dd className="font-medium tabular-nums">
                    {formatearTelefono(apr.telefono)}
                  </dd>
                </div>
              )}
              {apr.email && (
                <div className="flex gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                  <dd className="font-medium break-all">{apr.email}</dd>
                </div>
              )}
              {apr.horarioAtencion && (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                  <dd className="font-medium whitespace-pre-line">
                    {apr.horarioAtencion}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {(hayTarifas || apr.infoPago) && (
            <section className="rounded-md border-[3px] border-[#1a1a1a] p-6">
              <h2 className="text-[0.85rem] font-bold tracking-[0.08em] text-[#1a1a1a]/70 uppercase">
                Tarifas y pago
              </h2>

              {hayTarifas && (
                <dl className="mt-4 flex flex-col gap-3 text-[0.98rem]">
                  {apr.tarifaCargoFijo !== null && (
                    <div className="flex items-center justify-between gap-3 border-b-2 border-[#1a1a1a]/10 pb-3">
                      <dt className="font-medium text-[#1a1a1a]/70">
                        Cargo fijo
                      </dt>
                      <dd className="text-[1.15rem] font-bold tabular-nums">
                        {clp.format(apr.tarifaCargoFijo)}
                      </dd>
                    </div>
                  )}
                  {apr.tarifaMetroCubico !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-medium text-[#1a1a1a]/70">
                        Metro cúbico (m³)
                      </dt>
                      <dd className="text-[1.15rem] font-bold tabular-nums">
                        {clp.format(apr.tarifaMetroCubico)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {apr.infoPago && (
                <p className="mt-4 border-t-2 border-[#1a1a1a]/10 pt-4 text-[0.92rem] leading-relaxed whitespace-pre-line text-[#1a1a1a]/75">
                  {apr.infoPago}
                </p>
              )}
            </section>
          )}
        </div>
      </main>

      <footer className="border-t-[3px] border-[#1a1a1a] bg-[#1a1a1a] text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[0.85rem] sm:px-8">
          <span className="font-medium text-white/70">
            © {new Date().getFullYear()} {apr.nombre}
          </span>
          <span className="text-white/70">
            Sitio creado con{" "}
            <a
              href="https://facilagua.com"
              className="font-bold text-[#C3F207] hover:underline"
            >
              FacilAgua
            </a>
          </span>
        </div>
      </footer>

      <AsistenteComite
        nombreApr={apr.nombre}
        slug={slug}
        dominio={dominio}
        telefono={apr.telefono}
      />
    </div>
  );
}
