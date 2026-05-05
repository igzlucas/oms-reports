"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CircleUser, Store as StoreIcon, LayoutDashboard, ShoppingCart, Package, TrendingUp, Settings, LogOut } from "lucide-react"
import { signOut } from "firebase/auth"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { useDashboard } from "@/app/dashboard/layout"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, requiresStore: false },
  { href: "/dashboard/stores", label: "Tiendas", icon: StoreIcon, requiresStore: false },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart, requiresStore: true },
  { href: "/dashboard/products", label: "Productos", icon: Package, requiresStore: true },
  { href: "/dashboard/profit-boost", label: "Ganancias", icon: TrendingUp, requiresStore: true },
];

export function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { activeStore } = useDashboard();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      toast({ title: "Cierre de Sesión Exitoso", description: "Has cerrado sesión correctamente." });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ variant: "destructive", title: "Error al Cerrar Sesión", description: "Ocurrió un error. Por favor, inténtalo de nuevo." });
    }
  };

  const getIsActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass backdrop */}
      <div className="absolute inset-0 bg-[#0f0d0b]/95 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20" />

      <div className="relative flex h-16 items-center gap-4 px-4 md:px-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mr-6 shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:shadow-amber-500/30 transition-shadow">
            <StoreIcon className="h-4 w-4 text-white" />
          </div>
          <span className="hidden md:block text-white font-bold text-sm tracking-wide">MiBazar</span>
          <span className="hidden md:block text-white/30 text-xs">Dashboard</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isDisabled = item.requiresStore && !activeStore;
            const isActive = getIsActive(item.href);

            return (
              <Link
                key={item.href}
                href={isDisabled ? '#' : item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-white/50 hover:text-white/80 hover:bg-white/6",
                  isDisabled && "pointer-events-none opacity-30"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-amber-400" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Logo */}
        <div className="md:hidden">
          <span className="text-white font-bold">MiBazar</span>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Active store badge */}
          {activeStore && (
            <div className="hidden md:flex items-center gap-2 bg-white/6 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-white/60 text-xs font-medium truncate max-w-[120px]">{activeStore.name}</span>
            </div>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 bg-white/8 hover:bg-white/15 border border-white/10 transition-all duration-200"
              >
                <CircleUser className="h-[18px] w-[18px] text-white/80" />
                <span className="sr-only">Menú de usuario</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 rounded-2xl shadow-xl shadow-black/20 bg-[#1a1410] border border-white/10 p-1"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs text-white/40 font-normal">
                {user?.displayName || 'Vendedor'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/8 my-1" />
              <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-white/70 focus:text-white focus:bg-white/8">
                <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/8 my-1" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xl cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 flex items-center gap-2.5 px-3 py-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
