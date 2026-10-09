import Link from "next/link";
import { LifeBuoy, Menu } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { AyudaSidebar } from "@/components/ayuda/ayuda-sidebar";

/** Marco común del centro de ayuda: cabecera, menú lateral desplegable y pie. */
export function AyudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-7 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="size-6" />
            Facilapr
          </Link>
          <Link
            href="/ayuda"
            className="inline-flex items-center gap-1.5 text-[0.88rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            <LifeBuoy className="size-4" />
            Centro de ayuda
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-2 md:flex-row md:gap-0">
        {/* En celular el menú va plegado arriba; en escritorio queda fijo a la izquierda. */}
        <aside className="shrink-0 border-b border-border px-5 py-3 md:w-64 md:border-r md:border-b-0 md:px-4 md:py-8">
          <details className="group md:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[0.9rem] font-medium">
              <Menu className="size-4" />
              Menú de guías
            </summary>
            <div className="mt-3">
              <AyudaSidebar />
            </div>
          </details>
          <div className="sticky top-6 hidden md:block">
            <AyudaSidebar />
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-7 text-[0.85rem] text-muted-foreground">
          <span>¿No encuentras lo que buscas? Escríbenos desde la página principal.</span>
          <Link href="/#contacto" className="font-medium text-primary hover:underline">
            Contactar a Facilapr
          </Link>
        </div>
      </footer>
    </div>
  );
}
