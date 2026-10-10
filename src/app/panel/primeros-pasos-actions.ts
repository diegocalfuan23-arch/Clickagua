"use server";

import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boletas, invitaciones, lecturas, socios } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";

export type PasoPrimeros = {
  id: string;
  titulo: string;
  texto: string;
  href: string;
  /** Recorrido guiado de este paso (ver lib/recorridos.ts). */
  recorrido?: string;
  hecho: boolean;
  opcional?: boolean;
};

export type ProgresoPrimerosPasos = {
  pasos: PasoPrimeros[];
  hechos: number;
  total: number;
};

/**
 * Avance de la guía de primeros pasos. Se deduce de los datos del comité
 * (tarifas puestas, socios cargados, lecturas, boletas): no hay nada que marcar
 * a mano ni columna nueva, y si el comité hace el paso por otro camino, el
 * paso queda hecho igual. Devuelve null cuando lo esencial ya está hecho.
 */
export async function progresoPrimerosPasos(): Promise<ProgresoPrimerosPasos | null> {
  const { apr } = await requireAdmin();

  const contar = async (consulta: Promise<{ n: number }[]>) =>
    (await consulta)[0]?.n ?? 0;

  const [nSocios, nLecturas, nBoletas, nInvitaciones] = await Promise.all([
    contar(db.select({ n: count() }).from(socios).where(eq(socios.aprId, apr.id))),
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

  const pasos: PasoPrimeros[] = [
    {
      id: "datos",
      titulo: "Completa los datos del comité",
      texto:
        "Teléfono y dirección (en Comité) y cómo se paga (en Facturación). Salen en cada recibo.",
      href: "/panel/configuracion",
      recorrido: "configuracion",
      hecho: Boolean(
        apr.telefono?.trim() && apr.direccion?.trim() && apr.infoPago?.trim()
      ),
    },
    {
      id: "tarifas",
      titulo: "Define tus tarifas",
      texto: "El cargo fijo y el valor del m³: con eso se calcula cada boleta.",
      href: "/panel/configuracion",
      recorrido: "configuracion",
      hecho: apr.tarifaCargoFijo !== null && apr.tarifaMetroCubico !== null,
    },
    {
      id: "socios",
      titulo: "Carga a tus socios",
      texto: "Importa el padrón desde tu planilla de Excel, o agrégalos de a uno.",
      href: "/panel/socios",
      recorrido: "socios",
      hecho: nSocios > 0,
    },
    {
      id: "lecturas",
      titulo: "Carga las lecturas de los medidores",
      texto:
        "La primera de cada medidor es la lectura inicial: sirve de punto de partida.",
      href: "/panel/lecturas",
      recorrido: "lecturas",
      hecho: nLecturas > 0,
    },
    {
      id: "boletas",
      titulo: "Emite tu primera boleta",
      texto: "Con la lectura aprobada y las tarifas, se genera sola.",
      href: "/panel/boletas",
      recorrido: "boletas",
      hecho: nBoletas > 0,
    },
    {
      id: "tecnico",
      titulo: "Invita a quien toma las lecturas",
      texto: "Dale acceso solo a lecturas, desde su celular, incluso sin señal.",
      href: "/panel/tecnicos",
      recorrido: "tecnicos",
      hecho: nInvitaciones > 0,
      opcional: true,
    },
  ];

  const esenciales = pasos.filter((p) => !p.opcional);
  const hechos = esenciales.filter((p) => p.hecho).length;
  if (hechos === esenciales.length) return null;

  return { pasos, hechos, total: esenciales.length };
}
