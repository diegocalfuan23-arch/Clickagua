import Link from "next/link";
import { Droplet } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="px-7 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold"
        >
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-secondary">
            <Droplet className="size-3.5 fill-white text-white" />
          </span>
          ClickAgua
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-7 py-10">
        {children}
      </main>

      <footer className="px-7 py-6 text-center text-[0.8rem] text-muted-foreground">
        &copy; 2026 ClickAgua · Para comités de agua potable rural de Chile
      </footer>
    </div>
  );
}
