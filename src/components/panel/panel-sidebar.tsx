"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Droplet,
  Globe,
  LayoutDashboard,
  Users,
  ReceiptText,
  MessageSquare,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const gestion = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard },
  { href: "/panel/socios", label: "Socios", icon: Users },
  { href: "/panel/boletas", label: "Boletas", icon: ReceiptText },
];

const atencion = [
  { href: "/panel/conversaciones", label: "Conversaciones", icon: MessageSquare },
  { href: "/panel/sitio", label: "Sitio público", icon: Globe },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
];

type Enlace = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

/**
 * El componente base usa `sidebar-accent` tanto para hover como para el ítem
 * activo. Como el activo va en celeste, dejamos el hover en un gris neutro
 * para que pasar el mouse no se confunda con estar seleccionado.
 */
function GrupoEnlaces({
  titulo,
  enlaces,
  pathname,
}: {
  titulo: string;
  enlaces: Enlace[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{titulo}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {enlaces.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                render={<Link href={href} />}
                isActive={pathname === href}
                tooltip={label}
                className="hover:bg-muted hover:text-foreground data-active:hover:bg-sidebar-accent data-active:hover:text-sidebar-accent-foreground"
              >
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function PanelSidebar({
  apr,
  comuna,
}: {
  apr: string;
  comuna: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/panel" />}
              className="hover:bg-transparent active:bg-transparent"
            >
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-secondary">
                <Droplet className="size-4 fill-white text-white" />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">ClickAgua</span>
                <span className="truncate text-xs text-muted-foreground">
                  {apr}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <GrupoEnlaces titulo="Gestión" enlaces={gestion} pathname={pathname} />
        <GrupoEnlaces titulo="Atención" enlaces={atencion} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex flex-col gap-0.5 px-2 py-1 text-xs group-data-[collapsible=icon]:hidden">
          <span className="truncate font-medium">{apr}</span>
          <span className="truncate text-muted-foreground">{comuna}</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
