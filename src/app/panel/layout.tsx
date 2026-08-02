import { requireApr } from "@/lib/apr-session";
import { PanelSidebar } from "@/components/panel/panel-sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, apr } = await requireApr();
  const rol = user.rol === "OPERADOR" ? "OPERADOR" : "ADMIN";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <PanelSidebar apr={apr.nombre} comuna={apr.comuna} rol={rol} />

        {/* El gradiente va en el contenedor, no en el área de contenido: así
            cubre también el header. Centrado en 50% 50% para que el velo quede
            al medio de la pantalla y se desvanezca hacia los bordes. */}
        <SidebarInset className="bg-[radial-gradient(90%_70%_at_50%_50%,color-mix(in_oklch,var(--primary),transparent_90%),transparent_75%)]">
          <header className="flex h-14 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <span className="text-sm font-medium">{apr.nombre}</span>
            <div className="ml-auto">
              <SignOutButton />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-5 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
