"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Package,
  Settings,
  ShoppingCart,
  StoreIcon,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useDashboard } from "@/app/dashboard/layout";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Panel", tooltip: "Panel Principal", requiresStore: false },
  { href: "/dashboard/stores", icon: StoreIcon, label: "Tiendas", tooltip: "Tiendas", requiresStore: false },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Ventas", tooltip: "Ventas", requiresStore: true },
  { href: "/dashboard/products", icon: Package, label: "Productos", tooltip: "Productos", requiresStore: true },
  { href: "/dashboard/profit-boost", icon: TrendingUp, label: "Ganancias", tooltip: "Ganancias Potenciadas", requiresStore: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { activeStore } = useDashboard();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isDisabled = item.requiresStore && !activeStore;
        const tooltip = isDisabled ? "Debes crear o seleccionar una tienda primero" : item.tooltip;
        
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton 
              asChild 
              isActive={!isDisabled && pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
              tooltip={tooltip}
              disabled={isDisabled}
              aria-disabled={isDisabled}
            >
              <Link href={isDisabled ? "#" : item.href} className={isDisabled ? "pointer-events-none" : ""}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function SidebarFooterNav() {
    const pathname = usePathname();
    return (
        <SidebarMenu>
            <SidebarMenuItem>
            <SidebarMenuButton 
                asChild 
                isActive={pathname === "/dashboard/settings"}
                tooltip="Configuración"
            >
                <Link href="/dashboard/settings">
                <Settings />
                <span>Configuración</span>
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
      </SidebarMenu>
    )
}
