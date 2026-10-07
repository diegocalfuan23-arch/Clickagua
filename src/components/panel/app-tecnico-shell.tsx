import { Logo } from "@/components/marca/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * Marco del técnico de terreno: se ve como una app de teléfono, no como el
 * panel de escritorio. Sin menú lateral (solo tiene una tarea), encabezado
 * compacto fijo y una columna angosta centrada; en un computador queda como
 * una "app" en medio de la pantalla en vez de un formulario estirado.
 *
 * La barra de pestañas de abajo la pone cada pantalla (necesita su estado);
 * por eso el contenido deja aire abajo (pb-28).
 */
export function AppTecnicoShell({
  comite,
  children,
}: {
  comite: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(90%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_90%),transparent_70%)]">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[480px] items-center gap-3 px-4">
          <Logo className="size-8" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[0.95rem] font-semibold">{comite}</div>
            <div className="text-[0.75rem] text-muted-foreground">
              Técnico de terreno
            </div>
          </div>
          <SignOutButton compacto />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pt-5 pb-28">
        {children}
      </main>
    </div>
  );
}
