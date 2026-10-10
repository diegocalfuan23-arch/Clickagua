"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { PlayCircle } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import {
  marcarRecorridoVisto,
  recorridoYaVisto,
} from "@/app/panel/recorrido-actions";

const EVENTO = "facilapr:recorrido";

/** Cada elemento del menú lleva data-tour="<ruta>" (ver panel-sidebar.tsx). */
const enMenu = (ruta: string) => `[data-tour="${ruta}"]`;

/**
 * Recorrido guiado del panel: oscurece la pantalla y va resaltando, una por
 * una, las partes que el comité usa para empezar. Los pasos cuyo elemento no
 * está en pantalla (por ejemplo el menú en el celular) se omiten solos.
 */
const PASOS: { selector?: string; titulo: string; texto: string; lado?: "right" | "bottom" | "top" }[] = [
  {
    titulo: "Bienvenido a Facilapr 👋",
    texto:
      "Te mostramos dónde está cada cosa para que emitas tu primera boleta. Toma menos de un minuto.",
  },
  {
    selector: '[data-tour="primeros-pasos"]',
    titulo: "Tu guía de primeros pasos",
    texto:
      "Aquí ves tu avance. Se va marcando sola a medida que haces cada paso, y cada uno trae su guía.",
    lado: "bottom",
  },
  {
    selector: enMenu("/panel/configuracion"),
    titulo: "1 · Configuración",
    texto:
      "Empieza aquí: tus tarifas (cargo fijo y valor del m³) y los datos que salen en cada recibo, como el teléfono y cómo se paga.",
  },
  {
    selector: enMenu("/panel/socios"),
    titulo: "2 · Socios",
    texto:
      "Carga tu padrón completo desde tu planilla de Excel, o agrégalos de a uno. Aquí también filtras entre socios y usuarios.",
  },
  {
    selector: enMenu("/panel/lecturas"),
    titulo: "3 · Lecturas",
    texto:
      "Aquí revisas y apruebas las lecturas de los medidores. Solo las aprobadas generan boleta.",
  },
  {
    selector: enMenu("/panel/lecturas/terreno"),
    titulo: "Modo terreno",
    texto:
      "Para tomar las lecturas desde el celular, incluso sin señal. Se envían solas cuando vuelve la conexión.",
  },
  {
    selector: enMenu("/panel/tecnicos"),
    titulo: "Técnicos",
    texto:
      "Invita a quien recorre los medidores. Solo ve la sección de lecturas, nada más.",
  },
  {
    selector: enMenu("/panel/boletas"),
    titulo: "4 · Boletas",
    texto:
      "Aquí emites las boletas, mandas el recibo en PDF por WhatsApp y registras los pagos.",
  },
  {
    selector: enMenu("/panel/socios/solicitudes"),
    titulo: "Solicitudes",
    texto:
      "Cuando un socio pida entrar a su cuenta en línea, lo apruebas aquí. Solo si reconoces su RUT.",
  },
  {
    selector: enMenu("/ayuda"),
    titulo: "Centro de ayuda",
    texto:
      "Guías paso a paso con capturas de pantalla, por si te trabas en algo.",
  },
  {
    titulo: "¡Listo! 🎉",
    texto:
      "Empieza por el primer paso de tu guía. Puedes repetir este recorrido cuando quieras con «Ver recorrido».",
  },
];

/** Botón para repetir el recorrido. Lo usa la tarjeta de primeros pasos. */
export function BotonRecorrido() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO))}
      className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-primary hover:underline"
    >
      <PlayCircle className="size-4" />
      Ver recorrido
    </button>
  );
}

/**
 * Lanza el recorrido solo la primera vez que esa persona entra al resumen y,
 * después, cuando pulsa «Ver recorrido». «Primera vez» se guarda en la base
 * (columna recorridoVisto del usuario) y, de respaldo, en el navegador.
 */
export function Recorrido({ usuarioId }: { usuarioId: string }) {
  const pathname = usePathname();
  const { setOpen, isMobile } = useSidebar();
  const activo = useRef<ReturnType<typeof driver> | null>(null);

  const lanzar = useCallback(() => {
    if (activo.current?.isActive()) return;

    // El menú colapsado no tiene los ítems en pantalla: se abre primero.
    if (!isMobile) setOpen(true);

    window.setTimeout(() => {
      const steps: DriveStep[] = PASOS.filter(
        (p) => !p.selector || document.querySelector(p.selector)
      ).map((p) => ({
        element: p.selector,
        popover: {
          title: p.titulo,
          description: p.texto,
          side: p.lado ?? "right",
          align: "start",
        },
      }));

      const recorrido = driver({
        steps,
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Siguiente",
        prevBtnText: "Atrás",
        doneBtnText: "Empezar",
        popoverClass: "facilapr-tour",
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 10,
        allowClose: true,
      });
      activo.current = recorrido;
      recorrido.drive();
    }, 400);
  }, [isMobile, setOpen]);

  useEffect(() => {
    const alPedirlo = () => lanzar();
    window.addEventListener(EVENTO, alPedirlo);
    return () => window.removeEventListener(EVENTO, alPedirlo);
  }, [lanzar]);

  // Primera vez: solo en el resumen y solo si la guía de primeros pasos sigue
  // a la vista (un comité que ya terminó no necesita el recorrido). Se recuerda
  // en la base, por usuario (así no se repite en otro equipo); el navegador es
  // el respaldo mientras la columna no exista o no haya conexión.
  useEffect(() => {
    if (pathname !== "/panel") return;

    const clave = `facilapr-recorrido-visto-${usuarioId}`;
    let visto = false;
    try {
      visto = Boolean(localStorage.getItem(clave));
    } catch {
      // Sin almacenamiento local se decide solo con lo que diga la base.
    }
    if (visto) return;

    let cancelado = false;
    const espera = window.setTimeout(async () => {
      if (!document.querySelector('[data-tour="primeros-pasos"]')) return;

      const enBase = await recorridoYaVisto().catch(() => null);
      if (cancelado) return;

      if (enBase === true) {
        try {
          localStorage.setItem(clave, "1");
        } catch {
          // Da igual: la base ya lo sabe.
        }
        return;
      }

      try {
        localStorage.setItem(clave, "1");
      } catch {
        // Si no se puede guardar, saldrá otra vez en la próxima visita.
      }
      void marcarRecorridoVisto().catch(() => undefined);
      lanzar();
    }, 900);

    return () => {
      cancelado = true;
      window.clearTimeout(espera);
    };
  }, [pathname, usuarioId, lanzar]);

  return null;
}
