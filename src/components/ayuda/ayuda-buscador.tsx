"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Search } from "lucide-react";
import {
  ARTICULOS,
  CATEGORIAS,
  normalizar,
  textoBusqueda,
} from "@/lib/ayuda";

/** Índice del centro de ayuda: buscador y artículos agrupados por categoría. */
export function AyudaBuscador() {
  const [consulta, setConsulta] = useState("");

  const indice = useMemo(
    () => ARTICULOS.map((a) => ({ a, texto: textoBusqueda(a) })),
    [],
  );

  const q = normalizar(consulta.trim());
  const resultados = q
    ? indice.filter((i) => i.texto.includes(q)).map((i) => i.a)
    : null;

  return (
    <div>
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="¿Qué necesitas hacer? Ej: emitir una boleta"
          aria-label="Buscar en el centro de ayuda"
          className="h-12 w-full rounded-full border border-border bg-background pr-4 pl-11 text-[0.95rem] shadow-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
        />
      </div>

      {resultados ? (
        <div className="mx-auto mt-10 max-w-[820px]">
          <p className="mb-4 font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
            {resultados.length}{" "}
            {resultados.length === 1 ? "resultado" : "resultados"}
          </p>
          {resultados.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[0.92rem] text-muted-foreground">
              No encontramos nada con esa búsqueda. Prueba con otra palabra, o
              escríbenos desde el formulario de contacto.
            </p>
          ) : (
            <ListaArticulos articulos={resultados} />
          )}
        </div>
      ) : (
        <div className="mx-auto mt-12 flex max-w-[820px] flex-col gap-12">
          {CATEGORIAS.map((c) => {
            const items = ARTICULOS.filter((a) => a.categoria === c.nombre);
            if (items.length === 0) return null;
            return (
              <section key={c.nombre}>
                <span className="font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase">
                  {c.nombre}
                </span>
                <p className="mt-1.5 mb-4 text-[0.92rem] text-muted-foreground">
                  {c.descripcion}
                </p>
                <ListaArticulos articulos={items} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ListaArticulos({
  articulos,
}: {
  articulos: (typeof ARTICULOS)[number][];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {articulos.map((a) => (
        <li key={a.slug}>
          <Link
            href={`/ayuda/${a.slug}`}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="min-w-0">
              <h3 className="text-[1rem] font-semibold">{a.titulo}</h3>
              <p className="mt-1 text-[0.88rem] text-muted-foreground">
                {a.resumen}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                <span>{a.para}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {a.minutos} min
                </span>
                <span>{a.pasos.length} pasos</span>
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
