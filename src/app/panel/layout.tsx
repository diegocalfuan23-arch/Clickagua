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
  const { apr } = await requireApr();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <PanelSidebar apr={apr.nombre} comuna={apr.comuna} />

        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <span className="text-sm font-medium">{apr.nombre}</span>
            <div className="ml-auto">
              <SignOutButton />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
