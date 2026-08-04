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
import { AsistenteComite } from "@/components/sitio/asistente-comite";

/*
  Referencia real: sitio del Comité APR Caburgua (.impeccable/referencias/
  apr-caburgua.png), señalada por el usuario tras rechazar un primer intento
  "señalética vial" que se sintió como bloques de color genéricos, no como
  algo hecho por y para la comunidad. Se toma de esa referencia: paleta de
  azul cielo suave (no índigo saturado a página completa), un divisor de
  sección en onda, tarjetas con sombra suave en vez de bordes gruesos, y una
  frase de bienvenida en cursiva cálida. No se copian fotos ni ilustraciones
  a color de la referencia porque FacilAgua no tiene fotografía real de
  ningún comité todavía — inventar esas fotos sería peor que no tenerlas.
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
    clase: "border-destructive/20 bg-destructive/[0.04]",
    color: "text-destructive",
    etiqueta: "Corte de agua",
  },
  MANTENCION: {
    icono: Wrench,
    clase: "border-tertiary/30 bg-tertiary/[0.06]",
    color: "text-tertiary-texto",
    etiqueta: "Mantención",
  },
  NOTICIA: {
    icono: Droplets,
    clase: "border-primary/15 bg-primary/[0.04]",
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

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black/[0.04] bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4 sm:px-8">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/[0.08]">
            <Droplets className="size-5 text-primary" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[#1c2340]">
              {apr.nombre}
            </div>
            <div className="text-[0.8rem] text-[#1c2340]/55">
              {apr.comuna}
              {apr.region && `, ${apr.region}`}
            </div>
          </div>
        </div>
      </header>

      {/* Franja celeste con la bienvenida, cerrada por un borde en onda —
          el gesto más reconocible de la referencia real. */}
      <div className="bg-gradient-to-b from-[#e4f1f8] to-[#d6ebf3]">
        <div className="mx-auto max-w-5xl px-6 pt-12 pb-20 sm:px-8 sm:pt-16">
          <p
            className="text-[1.5rem] leading-snug text-[#1c2340] sm:text-[1.9rem]"
            style={{ fontFamily: "var(--font-sitio-calida), serif" }}
          >
            {apr.sitioDescripcion ??
              `Comité de Agua Potable Rural de ${apr.comuna}. Aquí encuentras nuestros datos de contacto, avisos de corte y la información de pago.`}
          </p>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.95rem] font-medium text-white shadow-[0_8px_20px_-6px_rgba(54,7,242,0.45)] transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="size-4" />
              Consulta tu cuenta por WhatsApp
            </a>
          )}
        </div>

        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="block h-[36px] w-full text-white sm:h-[48px]"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,32 C240,64 480,0 720,20 C960,40 1200,64 1440,28 L1440,60 L0,60 Z"
          />
        </svg>
      </div>

      <main className="mx-auto max-w-5xl px-6 pt-10 pb-24 sm:px-8 sm:pb-10">
        {avisos.length > 0 && (
          <section>
            <h2 className="text-[1.2rem] font-semibold text-[#1c2340]">
              Avisos
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {avisos.map((aviso) => {
                const estilo = ESTILO_AVISO[aviso.tipo];
                const Icono = estilo.icono;
                const rango = rangoFechas(aviso.inicia, aviso.termina);

                return (
                  <article
                    key={aviso.id}
                    className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(28,35,64,0.04)] ${estilo.clase}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icono className={`size-4 ${estilo.color}`} />
                      <span
                        className={`text-[0.78rem] font-semibold tracking-wide uppercase ${estilo.color}`}
                      >
                        {estilo.etiqueta}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[1.05rem] font-semibold text-[#1c2340]">
                      {aviso.titulo}
                    </h3>
                    {rango && (
                      <p className="mt-1 text-[0.88rem] font-medium text-[#1c2340]/60">
                        {rango}
                      </p>
                    )}
                    {aviso.sectores && (
                      <p className="mt-1 text-[0.88rem] text-[#1c2340]/60">
                        Sectores: {aviso.sectores}
                      </p>
                    )}
                    {aviso.cuerpo && (
                      <p className="mt-2 text-[0.93rem] leading-relaxed text-[#1c2340]/70">
                        {aviso.cuerpo}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div
          className={`grid gap-5 md:grid-cols-2 ${avisos.length > 0 ? "mt-10" : ""}`}
        >
          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(28,35,64,0.06)]">
            <h2 className="text-[1.1rem] font-semibold text-[#1c2340]">
              Contacto
            </h2>
            <dl className="mt-4 flex flex-col gap-3.5 text-[0.93rem]">
              {apr.direccion && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                  <dd className="text-[#1c2340]/85">{apr.direccion}</dd>
                </div>
              )}
              {apr.telefono && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary/70" />
                  <dd className="tabular-nums text-[#1c2340]/85">
                    {formatearTelefono(apr.telefono)}
                  </dd>
                </div>
              )}
              {apr.email && (
                <div className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-primary/70" />
                  <dd className="break-all text-[#1c2340]/85">{apr.email}</dd>
                </div>
              )}
              {apr.horarioAtencion && (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary/70" />
                  <dd className="whitespace-pre-line text-[#1c2340]/85">
                    {apr.horarioAtencion}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {(hayTarifas || apr.infoPago) && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(28,35,64,0.06)]">
              <h2 className="text-[1.1rem] font-semibold text-[#1c2340]">
                Tarifas y pago
              </h2>

              {hayTarifas && (
                <dl className="mt-4 flex flex-col gap-2.5 text-[0.93rem]">
                  {apr.tarifaCargoFijo !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#1c2340]/55">Cargo fijo</dt>
                      <dd className="font-medium tabular-nums text-[#1c2340]">
                        {clp.format(apr.tarifaCargoFijo)}
                      </dd>
                    </div>
                  )}
                  {apr.tarifaMetroCubico !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#1c2340]/55">Metro cúbico (m³)</dt>
                      <dd className="font-medium tabular-nums text-[#1c2340]">
                        {clp.format(apr.tarifaMetroCubico)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {apr.infoPago && (
                <p className="mt-4 border-t border-black/[0.06] pt-4 text-[0.93rem] leading-relaxed whitespace-pre-line text-[#1c2340]/70">
                  {apr.infoPago}
                </p>
              )}
            </section>
          )}
        </div>
      </main>

      <footer className="mt-8 border-t border-black/[0.06] bg-[#f4f8fa]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[0.85rem] text-[#1c2340]/60 sm:px-8">
          <span>
            © {new Date().getFullYear()} {apr.nombre}
          </span>
          <span>
            Sitio creado con{" "}
            <a
              href="https://facilagua.com"
              className="font-medium text-primary hover:underline"
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
