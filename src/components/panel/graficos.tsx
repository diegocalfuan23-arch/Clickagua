/**
 * Gráficos en SVG puro. Son formas simples —una línea y un área— así que no
 * vale la pena sumar una librería de charts al bundle por esto.
 */

function puntosDeRuta(valores: number[], ancho: number, alto: number) {
  if (valores.length < 2) return null;

  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const rango = max - min || 1;
  const paso = ancho / (valores.length - 1);

  return valores.map((valor, i) => ({
    x: i * paso,
    y: alto - ((valor - min) / rango) * alto,
  }));
}

/** Curva suave a partir de los puntos, para que no se vea quebrada. */
function rutaSuave(puntos: { x: number; y: number }[]) {
  return puntos.reduce((d, punto, i, todos) => {
    if (i === 0) return `M ${punto.x},${punto.y}`;
    const previo = todos[i - 1];
    const cx = (previo.x + punto.x) / 2;
    return `${d} C ${cx},${previo.y} ${cx},${punto.y} ${punto.x},${punto.y}`;
  }, "");
}

export function Sparkline({
  valores,
  className,
}: {
  valores: number[];
  className?: string;
}) {
  const ancho = 100;
  const alto = 28;
  const puntos = puntosDeRuta(valores, ancho, alto);
  if (!puntos) return null;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <path
        d={rutaSuave(puntos)}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function GraficoArea({
  valores,
  etiquetas,
}: {
  valores: number[];
  etiquetas: string[];
}) {
  const ancho = 600;
  const alto = 180;
  const puntos = puntosDeRuta(valores, ancho, alto - 10);
  if (!puntos) return null;

  const linea = rutaSuave(puntos);
  const area = `${linea} L ${ancho},${alto} L 0,${alto} Z`;
  const max = Math.max(...valores);

  return (
    <div>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        className="h-45 w-full"
        role="img"
        aria-label={`Consultas por mes, máximo ${max}`}
      >
        <defs>
          <linearGradient id="degradadoArea" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--primary)"
              stopOpacity="0.28"
            />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            y1={alto * f}
            x2={ancho}
            y2={alto * f}
            stroke="var(--border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill="url(#degradadoArea)" />
        <path
          d={linea}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-2 flex justify-between text-[0.72rem] text-muted-foreground">
        {etiquetas.map((etiqueta) => (
          <span key={etiqueta}>{etiqueta}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * Dos líneas comparadas en un espacio chico, para una tarjeta.
 * Comparte escala entre ambas series: si cada una usara la suya, dos
 * cantidades muy distintas se verían del mismo tamaño y engañarían.
 */
export function GraficoLineas({
  series,
  etiquetas,
}: {
  series: { nombre: string; valores: number[]; color: string }[];
  etiquetas: string[];
}) {
  const ancho = 300;
  const alto = 90;

  const todos = series.flatMap((s) => s.valores);
  if (todos.length === 0) return null;

  const max = Math.max(...todos, 1);
  const largo = Math.max(...series.map((s) => s.valores.length));
  if (largo < 2) return null;

  const paso = ancho / (largo - 1);
  const aPuntos = (valores: number[]) =>
    valores.map((v, i) => ({
      x: i * paso,
      // Dejamos 6px arriba para que el punto más alto no toque el borde.
      y: alto - 6 - (v / max) * (alto - 12),
    }));

  return (
    <div>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        className="h-22 w-full"
        role="img"
        aria-label={series
          .map((s) => `${s.nombre}: máximo ${Math.max(...s.valores)}`)
          .join(". ")}
      >
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1="0"
            y1={(alto - 12) * f + 6}
            x2={ancho}
            y2={(alto - 12) * f + 6}
            stroke="var(--border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {series.map((s) => (
          <path
            key={s.nombre}
            d={rutaSuave(aPuntos(s.valores))}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="mt-1.5 flex justify-between text-[0.7rem] text-muted-foreground">
        {etiquetas.map((e) => (
          <span key={e}>{e}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * Sparkline con área rellena, para las tarjetas de tendencia.
 * Toma el color de `currentColor`, así la tarjeta decide el tono.
 */
export function SparklineArea({ valores }: { valores: number[] }) {
  const ancho = 160;
  const alto = 48;
  const puntos = puntosDeRuta(valores, ancho, alto - 6);
  if (!puntos) return null;

  const linea = rutaSuave(puntos);
  const id = `spark-${valores.join("-").slice(0, 24)}`;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="none"
      className="h-12 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linea} L ${ancho},${alto} L 0,${alto} Z`} fill={`url(#${id})`} />
      <path
        d={linea}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Barras apiladas: una columna por período, cada serie encima de la anterior.
 * Con todo en cero dibuja las guías pero ninguna barra, en vez de inventar
 * alturas iguales.
 */
export function GraficoBarrasApiladas({
  series,
  etiquetas,
}: {
  series: { nombre: string; valores: number[]; color: string }[];
  etiquetas: string[];
}) {
  const alto = 200;
  const columnas = etiquetas.length;
  if (columnas === 0 || series.length === 0) return null;

  // El total más alto define la escala; si todo es cero usamos 1 para no
  // dividir por cero, y como ningún valor supera 0 no se dibuja nada.
  const totales = etiquetas.map((_, i) =>
    series.reduce((suma, s) => suma + (s.valores[i] ?? 0), 0)
  );
  const max = Math.max(...totales, 1);
  const hayDatos = totales.some((t) => t > 0);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: alto }}>
        {etiquetas.map((etiqueta, i) => (
          <div
            key={etiqueta}
            className="flex flex-1 flex-col justify-end gap-0.5"
            title={`${etiqueta}: ${totales[i]}`}
          >
            {series.map((s) => {
              const valor = s.valores[i] ?? 0;
              if (valor === 0) return null;
              return (
                <div
                  key={s.nombre}
                  className={`rounded-sm ${s.color}`}
                  style={{ height: `${(valor / max) * (alto - 20)}px` }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2 border-t border-border pt-2 text-[0.72rem] text-muted-foreground">
        {etiquetas.map((e) => (
          <span key={e} className="flex-1 text-center">
            {e}
          </span>
        ))}
      </div>

      {!hayDatos && (
        <p className="mt-3 text-center text-[0.83rem] text-muted-foreground">
          Sin datos todavía
        </p>
      )}
    </div>
  );
}

/** Barras simples verticales, con el valor máximo destacado. */
export function GraficoBarras({
  valores,
  etiquetas,
  color = "bg-primary",
}: {
  valores: number[];
  etiquetas: string[];
  color?: string;
}) {
  const alto = 130;
  const max = Math.max(...valores, 1);
  const hayDatos = valores.some((v) => v > 0);

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: alto }}>
        {valores.map((valor, i) => (
          <div
            key={etiquetas[i]}
            className="flex flex-1 flex-col justify-end"
            title={`${etiquetas[i]}: ${valor}`}
          >
            <div
              className={`rounded-t-md ${color} ${valor === max && hayDatos ? "" : "opacity-45"}`}
              style={{ height: `${Math.max((valor / max) * alto, valor > 0 ? 4 : 0)}px` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5 text-[0.72rem] text-muted-foreground">
        {etiquetas.map((e) => (
          <span key={e} className="flex-1 text-center">
            {e}
          </span>
        ))}
      </div>

      {!hayDatos && (
        <p className="mt-3 text-center text-[0.83rem] text-muted-foreground">
          Sin datos todavía
        </p>
      )}
    </div>
  );
}
