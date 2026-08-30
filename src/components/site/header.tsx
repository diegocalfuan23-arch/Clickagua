import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const enlaces = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#caracteristicas", label: "Beneficios" },
  { href: "#planes", label: "Planes" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 pt-4">
      <div className="mx-auto flex max-w-[1180px] justify-center px-7">
        <nav className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-border/90 bg-card/85 py-2 pr-2 pl-5 shadow-md backdrop-blur-md">
          <Link
            href="#"
            className="mr-1.5 flex items-center gap-2 text-base font-semibold"
          >
            <Logo className="size-6.5" />
            Facilapr
          </Link>

          <div className="hidden flex-1 gap-5.5 text-sm text-muted-foreground sm:flex">
            {enlaces.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="transition-colors hover:text-foreground"
              >
                {enlace.label}
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3.5">
            <Link
              href="/login"
              className="hidden text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Acceso APR
            </Link>
            <a
              href="#contacto"
              className={cn(
                buttonVariants(),
                "rounded-full bg-forest text-forest-foreground hover:bg-forest/90"
              )}
            >
              Solicitar una demo
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
