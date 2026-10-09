import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { Logo } from "@/components/marca/logo";

/** Marco común del centro de ayuda: cabecera con el logo y pie con enlaces. */
export function AyudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-4 px-7 py-5">
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

      {children}

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-7 text-[0.85rem] text-muted-foreground">
          <span>¿No encuentras lo que buscas? Escríbenos desde la página principal.</span>
          <Link href="/#contacto" className="font-medium text-primary hover:underline">
            Contactar a Facilapr
          </Link>
        </div>
      </footer>
    </div>
  );
}
