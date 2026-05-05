"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Bell,
  Store,
  LogOut,
  Settings,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  cartItemCount?: number;
  isAuthenticated?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

const Header = ({
  cartItemCount = 0,
  isAuthenticated = false,
  userName,
  isAdmin = false
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/inicio" className="flex items-center space-x-2">
<span className="text-xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
  MiBazar
</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/inicio" className="text-sm font-medium text-primary">
              Inicio
            </Link>
            <Link href="/catalogo" className="text-sm font-medium hover:text-primary transition-colors">
              Catálogo
            </Link>
            <Link href="/tiendas" className="text-sm font-medium hover:text-primary transition-colors">
              Tiendas
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{userName || "Mi Cuenta"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Mis Pedidos
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Heart className="mr-2 h-4 w-4" />
                    Favoritos
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Store className="mr-2 h-4 w-4" />
                        Panel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                <Button onClick={() => router.push('/login')} className="hidden sm:flex bg-amber-700 hover:bg-amber-800">
                    Iniciar Sesión
                </Button>
            )}
            {/* {(
                <Button onClick={() => router.push('/register')} size="sm" className="hidden sm:flex bg-amber-700 hover:bg-amber-800">
                    Registrarse
                </Button>
            )} */}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              <Link href="/inicio" className="text-sm font-medium text-primary">
                Inicio
              </Link>
              <Link href="/catalogo" className="text-sm font-medium hover:text-primary transition-colors">
                Catálogo
              </Link>
              <Link href="/tiendas" className="text-sm font-medium hover:text-primary transition-colors">
                Tiendas
              </Link>
              {!isAuthenticated && (
                <Button onClick={() => router.push('/login')} className="w-full">
                  Iniciar Sesión
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold text-gray-900">MiBazar</span>
            </div>
            <p className="text-sm text-gray-600 mb-6 max-w-xs">
              Tu mercado en línea favorito. Encuentra productos únicos de vendedores locales con la mejor calidad y precio.
            </p>
            {/* <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@mibazar.com
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +1 (234) 567-890
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ciudad, País
              </div>
            </div> */}
            <div className="flex space-x-2 mt-4">
              <a href="#" className="h-9 w-9 rounded-lg bg-gray-200 hover:bg-amber-700 hover:text-white flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg bg-gray-200 hover:bg-amber-700 hover:text-white flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg bg-gray-200 hover:bg-amber-700 hover:text-white flex items-center justify-center transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Encuentra</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/catalogo" className="hover:text-amber-700 transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/tiendas" className="hover:text-amber-700 transition-colors">
                  Tiendas
                </Link>
              </li>
            </ul>
          </div>

          {/* Mi Cuenta
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Mi Cuenta</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/cuenta" className="hover:text-amber-700 transition-colors">
                  Mi Cuenta
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="hover:text-amber-700 transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link href="/favoritos" className="hover:text-amber-700 transition-colors">
                  Lista de Deseos
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-amber-700 transition-colors">
                  Carrito
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Ayuda */}
          {/* <div>
            <h3 className="text-gray-900 font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/ayuda" className="hover:text-amber-700 transition-colors">
                  Ayuda
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-amber-700 transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/envios" className="hover:text-amber-700 transition-colors">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/devoluciones" className="hover:text-amber-700 transition-colors">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © 2026 MiBazar. Todos los derechos reservados.
          </p>
          {/* <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/terminos" className="hover:text-amber-700 transition-colors">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-amber-700 transition-colors">
              Privacidad
            </Link>
            <Link href="/cookies" className="hover:text-amber-700 transition-colors">
              Cookies
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default function InicioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header cartItemCount={3} isAuthenticated={false} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}