"use client";

import React from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Store as StoreIcon, LogOut, Heart, ClipboardList, CircleUser, ShoppingCart, LogIn } from "lucide-react";
import { signOut } from "firebase/auth";
import { doc } from 'firebase/firestore';

import { useUser, useFirebase, useUI, useDoc } from '@/firebase';
import { useCart } from '@/context/cart-context';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';
import { Logo } from '@/components/logo';


export function Header() {
    const { user, isUserLoading } = useUser();
    const { firestore, auth } = useFirebase();
    const router = useRouter();
    const pathname = usePathname();

    const { items } = useCart();
    const { openCartSheet } = useUI();
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const userProfileRef = React.useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
    const isSeller = userProfile?.role === 'seller';

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push("/login");
    };
    
    const navItems = [
        { href: '/inicio', label: 'Inicio' },
        { href: '/catalogo', label: 'Catálogo' },
        { href: '/tiendas', label: 'Tiendas' },
    ];

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center">
                {/* Logo */}
                <div className="mr-6 flex items-center">
                     <Logo />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                    {navItems.map(item => (
                         <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "transition-colors hover:text-foreground",
                                pathname === item.href ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                     {isSeller && (
                        <Link
                            href="/dashboard"
                            className={cn(
                                "transition-colors hover:text-foreground",
                                pathname.startsWith('/dashboard') ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            Dashboard
                        </Link>
                    )}
                </nav>

                {/* Right side Actions */}
                <div className="ml-auto flex items-center gap-2">

                    {/* Carrito — visible siempre, logueado o no */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative hidden md:flex"
                        onClick={openCartSheet}
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span className="sr-only">Ver Carrito</span>
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {totalItems}
                            </span>
                        )}
                    </Button>

                    {/* Loading skeleton */}
                    {(isUserLoading || isLoadingProfile) && (
                        <Skeleton className="h-8 w-8 rounded-full" />
                    )}
                    
                    {/* Usuario logueado */}
                    {!isUserLoading && user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <CircleUser className="h-5 w-5" />
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{user.displayName || 'Comprador'}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/catalogo/favorites">
                                        <Heart className="mr-2 h-4 w-4" />
                                        <span>Mis Favoritos</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/catalogo/favorite-stores">
                                        <StoreIcon className="mr-2 h-4 w-4" />
                                        <span>Tiendas Favoritas</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/catalogo/orders">
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        <span>Mis Pedidos</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Botón login para no logueados */}
                    {!isUserLoading && !user && (
                        <Button asChild className="hidden md:inline-flex">
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" />
                                Iniciar Sesión
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}