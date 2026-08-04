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
import { PaisajeRural } from "@/components/sitio/paisaje-rural";

/*
  Segunda pasada sobre la referencia real (Comité APR Caburgua). La primera
  pasada corrigió la paleta y la tipografía pero mantuvo el mismo esqueleto
  genérico: header, hero centrado, tarjetas en fila — el usuario señaló que
  eso seguía sintiéndose de plantilla, no la paleta. Esta versión rompe esa
  composición:
  - El hero es asimétrico (texto + ilustración propia), no centrado.
  - Tarifas —que casi todo comité carga desde el día uno— vive dentro del
    hero, no espera como otra tarjeta más abajo.
  - Contacto es una franja horizontal de datos, con otro ritmo que las
    tarjetas cuadradas.
  - Avisos, cuando existen, son una banda de ancho completo que interrumpe
    el layout — se sienten como una alerta real, no como contenido más.
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
    clase: "bg-destructive/[0.06] border-destructive/25",
    color: "text-destructive",
    etiqueta: "Corte de agua",
  },
  MANTENCION: {
    icono: Wrench,
    clase: "bg-tertiary/[0.08] border-tertiary/30",
    color: "text-tertiary-texto",
    etiqueta: "Mantención",
  },
  NOTICIA: {
    icono: Droplets,
    clase: "bg-primary/[0.05] border-primary/20",
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
  const hayContacto =
    apr.direccion || apr.telefono || apr.email || apr.horarioAtencion;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black/[0.04] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4 sm:px-8">
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

      {/* Hero asimétrico: texto + tarifa a la izquierda, ilustración a la
          derecha. En mobile la ilustración baja de tamaño y queda arriba
          del texto, como una franja, no como un bloque que empuja todo. */}
      <div className="bg-gradient-to-b from-[#eef7fb] to-[#d6ebf3]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pt-10 pb-14 sm:px-8 sm:pt-14 sm:pb-18 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-4">
          <div className="order-2 lg:order-1">
            <p
              className="text-[1.4rem] leading-snug text-[#1c2340] sm:text-[1.75rem]"
              style={{ fontFamily: "var(--font-sitio-calida), serif" }}
            >
              {apr.sitioDescripcion ??
                `Comité de Agua Potable Rural de ${apr.comuna}. Aquí encuentras nuestros datos de contacto, avisos de corte y la información de pago.`}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.95rem] font-medium text-white shadow-[0_8px_20px_-6px_rgba(54,7,242,0.45)] transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="size-4" />
                  Consulta tu cuenta por WhatsApp
                </a>
              )}
            </div>

            {hayTarifas && (
              <div className="mt-9 flex gap-8 border-t border-[#1c2340]/10 pt-6">
                {apr.tarifaCargoFijo !== null && (
                  <div>
                    <div className="text-[0.78rem] font-medium text-[#1c2340]/55">
                      Cargo fijo
                    </div>
                    <div className="mt-0.5 text-[1.6rem] leading-none font-semibold tabular-nums text-[#1c2340]">
                      {clp.format(apr.tarifaCargoFijo)}
                    </div>
                  </div>
                )}
                {apr.tarifaMetroCubico !== null && (
                  <div>
                    <div className="text-[0.78rem] font-medium text-[#1c2340]/55">
                      Valor del m³
                    </div>
                    <div className="mt-0.5 text-[1.6rem] leading-none font-semibold tabular-nums text-[#1c2340]">
                      {clp.format(apr.tarifaMetroCubico)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <PaisajeRural className="order-1 h-auto w-full max-w-[380px] justify-self-center lg:order-2 lg:max-w-none lg:justify-self-end" />
        </div>

        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="block h-[32px] w-full text-white sm:h-[44px]"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,32 C240,64 480,0 720,20 C960,40 1200,64 1440,28 L1440,60 L0,60 Z"
          />
        </svg>
      </div>

      {/* Avisos: banda de ancho completo cuando hay algo activo, para que
          se lea como una alerta y no como una tarjeta más de la página. */}
      {avisos.length > 0 && (
        <div className="border-b border-black/[0.05] bg-[#fbfbfc]">
          <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
            <h2 className="text-[0.8rem] font-semibold tracking-[0.06em] text-[#1c2340]/50 uppercase">
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
                    className={`rounded-2xl border p-5 ${estilo.clase}`}
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
          </div>
        </div>
      )}

      {/* Contacto: franja horizontal de datos, no una tarjeta cuadrada —
          distinto ritmo que la sección de arriba y que evita repetir el
          mismo contenedor una tercera vez en la página. */}
      {hayContacto && (
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
          <h2 className="text-[0.8rem] font-semibold tracking-[0.06em] text-[#1c2340]/50 uppercase">
            Contacto
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4 text-[0.95rem]">
            {apr.direccion && (
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-primary/70" />
                <span className="text-[#1c2340]/85">{apr.direccion}</span>
              </div>
            )}
            {apr.telefono && (
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-primary/70" />
                <span className="tabular-nums text-[#1c2340]/85">
                  {formatearTelefono(apr.telefono)}
                </span>
              </div>
            )}
            {apr.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary/70" />
                <span className="break-all text-[#1c2340]/85">
                  {apr.email}
                </span>
              </div>
            )}
            {apr.horarioAtencion && (
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary/70" />
                <span className="whitespace-pre-line text-[#1c2340]/85">
                  {apr.horarioAtencion}
                </span>
              </div>
            )}
          </div>

          {apr.infoPago && (
            <p className="mt-6 max-w-[65ch] border-t border-black/[0.06] pt-5 text-[0.93rem] leading-relaxed whitespace-pre-line text-[#1c2340]/70">
              {apr.infoPago}
            </p>
          )}
        </div>
      )}

      <footer className="border-t border-black/[0.06] bg-[#f4f8fa]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[0.85rem] text-[#1c2340]/60 sm:px-8">
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
