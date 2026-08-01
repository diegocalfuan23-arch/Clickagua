import { Logo } from "@/components/marca/logo";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-7 text-[0.85rem] text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Logo className="size-5.5" />
          FacilAgua
        </div>
        <span>
          &copy; 2026 FacilAgua. Hecho para los comités de agua potable rural
          de Chile.
        </span>
      </div>
    </footer>
  );
}
