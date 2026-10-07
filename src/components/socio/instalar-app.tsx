"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Evento de Chrome/Android que no está en los tipos del DOM. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CLAVE_OCULTO = "facilapr-instalar-oculto";

/** true solo en el navegador, sin desajuste de hidratación (el servidor ve false). */
function useMontado() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function yaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS no soporta display-mode: usa esta propiedad propia.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function fueDescartada() {
  try {
    return localStorage.getItem(CLAVE_OCULTO) === "1";
  } catch {
    // Sin almacenamiento (modo privado): no recordamos el cierre.
    return false;
  }
}

/**
 * Invita al socio a poner el panel en la pantalla de inicio. Android abre el
 * diálogo nativo; iOS no tiene API de instalación, así que ahí solo se
 * explica el gesto (Compartir → Añadir a pantalla de inicio). Si ya está
 * instalada o el socio la descartó, no aparece.
 */
export function InstalarApp() {
  const montado = useMontado();
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    const alPreguntar = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", alPreguntar);
    return () => window.removeEventListener("beforeinstallprompt", alPreguntar);
  }, []);

  if (!montado || cerrado || yaInstalada() || fueDescartada()) return null;

  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  // Solo se muestra donde hay algo útil que ofrecer.
  if (!evento && !esIOS) return null;

  function descartar() {
    setCerrado(true);
    try {
      localStorage.setItem(CLAVE_OCULTO, "1");
    } catch {
      // ver fueDescartada
    }
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setEvento(null);
    if (outcome === "accepted") setCerrado(true);
  }

  return (
    <div className="mb-8 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex-1">
        <div className="font-semibold">Ten tu cuenta a mano</div>
        {evento ? (
          <p className="mt-1 text-[0.88rem] text-muted-foreground">
            Instálala en tu celular y ábrela como cualquier app, sin buscar el
            link.
          </p>
        ) : (
          <p className="mt-1 text-[0.88rem] text-muted-foreground">
            Toca <Share className="inline size-4 align-text-bottom" />{" "}
            <strong>Compartir</strong> y luego{" "}
            <strong>Añadir a pantalla de inicio</strong> para abrirla como app.
          </p>
        )}
        {evento && (
          <Button size="sm" className="mt-3" onClick={instalar}>
            Instalar app
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={descartar}
        aria-label="Cerrar"
        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
