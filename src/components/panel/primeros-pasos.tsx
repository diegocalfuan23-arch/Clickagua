import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { ArrowRight, BookOpen, Check, Rocket } from "lucide-react";
import { db } from "@/lib/db";
import {
  boletas,
  invitaciones,
  lecturas,
  socios,
} from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type Paso = {
  id: string;
  titulo: string;
  texto: string;
  href: string;
  /** Guía del centro de ayuda para este paso. */
  guia?: string;
  hecho: boolean;
  opcional?: boolean;
};

type Comite = {
  id: string;
  telefono: string | null;
  direccion: string | null;
  infoPago: string | null;
  tarifaCargoFijo: number | null;
  tarifaMetroCubico: number | null;
};

/**
 * Guía de primeros pasos del resumen. El avance se deduce de los datos del
 * comité (tarifas puestas, socios cargados, lecturas, boletas), así que no
 * hay nada que marcar a mano ni columna nueva: si el comité hace el paso por
 * otro camino, el paso queda hecho igual. Desaparece cuando lo esencial está
 * hecho.
 */
export async function PrimerosPasos({ apr }: { apr: Comite }) {
  const contar = async (consulta: Promise<{ n: number }[]>) =>
    (await consulta)[0]?.n ?? 0;

  const [nSocios, nLecturas, nBoletas, nInvitaciones] = await Promise.all([
    contar(
      db.select({ n: count() }).from(socios).where(eq(socios.aprId, apr.id))
    ),
    contar(
      db
        .select({ n: count() })
        .from(lecturas)
        .innerJoin(socios, eq(lecturas.socioId, socios.id))
        .where(eq(socios.aprId, apr.id))
    ),
    contar(
      db
        .select({ n: count() })
        .from(boletas)
        .innerJoin(socios, eq(boletas.socioId, socios.id))
        .where(eq(socios.aprId, apr.id))
    ),
    contar(
      db
        .select({ n: count() })
        .from(invitaciones)
        .where(eq(invitaciones.aprId, apr.id))
    ),
  ]);

  const pasos: Paso[] = [
    {
      id: "datos",
      titulo: "Completa los datos del comité",
      texto:
        "Teléfono, dirección y cómo se paga. Salen en cada recibo que le llega a tus socios.",
      href: "/panel/configuracion",
      hecho: Boolean(
        apr.telefono?.trim() && apr.direccion?.trim() && apr.infoPago?.trim()
      ),
    },
    {
      id: "tarifas",
      titulo: "Define tus tarifas",
      texto: "El cargo fijo y el valor del m³: con eso se calcula cada boleta.",
      href: "/panel/configuracion",
      guia: "configurar-tarifas",
      hecho: apr.tarifaCargoFijo !== null && apr.tarifaMetroCubico !== null,
    },
    {
      id: "socios",
      titulo: "Carga a tus socios",
      texto: "Importa el padrón desde tu planilla de Excel, o agrégalos de a uno.",
      href: "/panel/socios",
      guia: "cargar-socios",
      hecho: nSocios > 0,
    },
    {
      id: "lecturas",
      titulo: "Carga las lecturas de los medidores",
      texto:
        "La primera de cada medidor es la lectura inicial: sirve de punto de partida.",
      href: "/panel/lecturas",
      guia: "lectura-inicial",
      hecho: nLecturas > 0,
    },
    {
      id: "boletas",
      titulo: "Emite tu primera boleta",
      texto: "Con la lectura aprobada y las tarifas, se genera sola.",
      href: "/panel/boletas",
      guia: "emitir-boleta",
      hecho: nBoletas > 0,
    },
    {
      id: "tecnico",
      titulo: "Invita a quien toma las lecturas",
      texto:
        "Dale acceso solo a lecturas, desde su celular, incluso sin señal.",
      href: "/panel/tecnicos",
      guia: "invitar-tecnico",
      hecho: nInvitaciones > 0,
      opcional: true,
    },
  ];

  const esenciales = pasos.filter((p) => !p.opcional);
  const hechos = esenciales.filter((p) => p.hecho).length;
  if (hechos === esenciales.length) return null;

  const siguiente = pasos.find((p) => !p.hecho && !p.opcional);
  const porcentaje = Math.round((hechos / esenciales.length) * 100);

  return (
    <section className="rounded-xl border border-primary/25 bg-primary/[0.04] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-4.5" />
          </span>
          <div>
            <h2 className="text-[1.05rem] font-semibold">
              Empieza a usar Facilapr
            </h2>
            <p className="mt-0.5 text-[0.87rem] text-muted-foreground">
              {hechos} de {esenciales.length} pasos listos. Sigue este orden y
              tendrás tu primera boleta emitida.
            </p>
          </div>
        </div>
        <Link
          href="/ayuda"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-primary hover:underline"
        >
          <BookOpen className="size-4" />
          Centro de ayuda
        </Link>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/15"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance de los primeros pasos"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <ol className="mt-4 flex flex-col divide-y divide-border/60 rounded-lg border border-border/60 bg-card">
        {pasos.map((p, i) => {
          const esSiguiente = p.id === siguiente?.id;
          return (
            <li
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5",
                esSiguiente && "bg-primary/[0.04]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-semibold",
                  p.hecho
                    ? "bg-forest text-white"
                    : esSiguiente
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {p.hecho ? <Check className="size-4" /> : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "font-medium",
                    p.hecho && "text-muted-foreground line-through"
                  )}
                >
                  {p.titulo}
                  {p.opcional && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-normal text-muted-foreground no-underline">
                      Opcional
                    </span>
                  )}
                </div>
                {!p.hecho && (
                  <p className="mt-0.5 text-[0.84rem] text-muted-foreground">
                    {p.texto}
                  </p>
                )}
              </div>

              {!p.hecho && (
                <div className="flex shrink-0 items-center gap-3">
                  {p.guia && (
                    <Link
                      href={`/ayuda/${p.guia}`}
                      target="_blank"
                      className="text-[0.82rem] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Ver guía
                    </Link>
                  )}
                  <Link
                    href={p.href}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.85rem] font-medium transition-colors",
                      esSiguiente
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border hover:bg-muted"
                    )}
                  >
                    {esSiguiente ? "Empezar" : "Ir"}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
