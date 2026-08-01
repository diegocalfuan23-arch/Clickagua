import { cn } from "@/lib/utils";

/**
 * La marca de FacilAgua: la misma f cursiva del favicon, para que la pestaña
 * del navegador y el encabezado muestren lo mismo.
 *
 * Es texto SVG y no una imagen, así escala sin perder nitidez y hereda el
 * color del tema en vez de traer el índigo quemado.
 */
export function Logo({
  className,
  titulo = "FacilAgua",
}: {
  className?: string;
  /** Solo para lectores de pantalla; el nombre visible va aparte. */
  titulo?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7 shrink-0", className)}
      role="img"
      aria-label={titulo}
    >
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <text
        x="16"
        y="23"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22"
        fontStyle="italic"
        fontWeight="bold"
        letterSpacing="-1"
        className="fill-white"
      >
        f
      </text>
    </svg>
  );
}

/** El logo junto al nombre, que es como aparece en encabezados y pies. */
export function LogoConNombre({
  className,
  tamano = "base",
}: {
  className?: string;
  tamano?: "sm" | "base";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo className={tamano === "sm" ? "size-5.5" : "size-7"} />
      <span
        className={cn(
          "font-semibold",
          tamano === "sm" ? "text-[0.95rem]" : "text-base"
        )}
      >
        FacilAgua
      </span>
    </span>
  );
}
