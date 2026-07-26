import { Droplet } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-7 text-[0.85rem] text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-5.5 items-center justify-center rounded-md bg-linear-to-br from-primary to-secondary">
            <Droplet className="size-3 fill-white text-white" />
          </span>
          ClickAgua
        </div>
        <span>
          &copy; 2026 ClickAgua. Hecho para los comités de agua potable rural
          de Chile.
        </span>
      </div>
    </footer>
  );
}
