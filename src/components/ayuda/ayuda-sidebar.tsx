"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown } from "lucide-react";
import { ARTICULOS, CATEGORIAS } from "@/lib/ayuda";
import { cn } from "@/lib/utils";

/** Menú lateral del centro de ayuda: categorías que se despliegan con sus guías. */
export function AyudaSidebar() {
  const pathname = usePathname();
  const slugActivo = pathname.startsWith("/ayuda/")
    ? pathname.slice("/ayuda/".length)
    : null;
  const categoriaActiva =
    ARTICULOS.find((a) => a.slug === slugActivo)?.categoria ??
    CATEGORIAS[0].nombre;

  // Abierta la categoría de la guía actual; el resto el lector las abre.
  const [abiertas, setAbiertas] = useState<Set<string>>(
    () => new Set([categoriaActiva]),
  );

  function alternar(nombre: string) {
    setAbiertas((prev) => {
      const sig = new Set(prev);
      if (sig.has(nombre)) sig.delete(nombre);
      else sig.add(nombre);
      return sig;
    });
  }

  return (
    <nav aria-label="Guías de ayuda" className="flex flex-col gap-1">
      <Link
        href="/ayuda"
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-[0.9rem] font-medium transition-colors",
          pathname === "/ayuda"
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted",
        )}
      >
        <BookOpen className="size-4" />
        Todas las guías
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        {CATEGORIAS.map((c) => {
          const items = ARTICULOS.filter((a) => a.categoria === c.nombre);
          const abierta = abiertas.has(c.nombre);
          return (
            <div key={c.nombre}>
              <button
                type="button"
                onClick={() => alternar(c.nombre)}
                aria-expanded={abierta}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-[0.72rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
              >
                {c.nombre}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    abierta && "rotate-180",
                  )}
                />
              </button>

              {abierta && (
                <ul className="mt-0.5 mb-2 ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
                  {items.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/ayuda/${a.slug}`}
                        aria-current={a.slug === slugActivo ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-[0.86rem] leading-snug transition-colors",
                          a.slug === slugActivo
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {a.titulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
