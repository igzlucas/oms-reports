'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Home, LayoutGrid, Store as StoreIcon, LayoutDashboard, ShoppingCart, LogIn, Heart } from 'lucide-react';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirebase, useDoc, useUI } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const { openCartSheet } = useUI();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  if (isUserLoading || (user && isLoadingProfile)) {
    return <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-40 md:hidden" />;
  }

  const isSeller = userProfile?.role === 'seller';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t shadow-lg z-40 md:hidden">
      <div className="grid h-full grid-cols-5 items-center">
        {/* Item 1: Inicio */}
        <Link
          href="/inicio"
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium',
            pathname === '/catalogo' ? 'text-primary' : 'text-muted-foreground',
            'hover:text-primary transition-colors'
          )}
        >
          <Home className="h-5 w-5 mb-1" />
          <span>Inicio</span>
        </Link>
        
        {/* Item 2: Catalogo */}
        <Link
          href="/catalogo"
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium',
            (pathname.startsWith('/catalogo/') || pathname.startsWith('/producto/')) ? 'text-primary' : 'text-muted-foreground',
            'hover:text-primary transition-colors'
          )}
        >
          <LayoutGrid className="h-5 w-5 mb-1" />
          <span>Catálogo</span>
        </Link>
        
        {/* Item 3: Center cart button */}
        <div className="flex justify-center">
          <Button
            size="icon"
            className="relative -mt-8 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            onClick={openCartSheet}
            disabled={items.length === 0}
            aria-label="Ver carrito"
          >
            <ShoppingCart className="h-7 w-7" />
            {totalItems > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        {/* Item 4: Tiendas */}
        <Link
          href="/tiendas"
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium text-muted-foreground',
            'hover:text-primary transition-colors'
          )}
        >
          <StoreIcon className="h-5 w-5 mb-1" />
          <span>Tiendas</span>
        </Link>
        
        {/* Item 5: Dynamic user/login slot */}
        {user ? (
          isSeller ? (
            <Link
              href="/dashboard"
              className={cn(
                'flex flex-col items-center justify-center h-full text-xs font-medium',
                pathname.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground',
                'hover:text-primary transition-colors'
              )}
            >
              <LayoutDashboard className="h-5 w-5 mb-1" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
                href="/catalogo/favorites"
                className={cn(
                    'flex flex-col items-center justify-center h-full text-xs font-medium',
                    pathname.startsWith('/catalogo/favorites') ? 'text-primary' : 'text-muted-foreground',
                    'hover:text-primary transition-colors'
                )}
                >
                <Heart className="h-5 w-5 mb-1" />
                <span>Favoritos</span>
            </Link>
          )
        ) : (
          <Link
            href="/login"
            className={cn(
              'flex flex-col items-center justify-center h-full text-xs font-medium',
              pathname === '/login' ? 'text-primary' : 'text-muted-foreground',
              'hover:text-primary transition-colors'
            )}
          >
            <LogIn className="h-5 w-5 mb-1" />
            <span>Ingresar</span>
          </Link>
        )}
      </div>
    </div>
  );
}
