'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, TrendingUp, Store as StoreIcon, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboard } from '../layout';

export function DashboardMobileNav() {
  const pathname = usePathname();
  const { activeStore } = useDashboard();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Panel', requiresStore: false },
    { href: '/dashboard/products', icon: Package, label: 'Productos', requiresStore: true },
    { href: '/dashboard/stores', icon: StoreIcon, label: 'Tiendas', requiresStore: false },
    { href: '/dashboard/profit-boost', icon: TrendingUp, label: 'Ganancias', requiresStore: true },
  ];
  
  const salesLink = { href: '/dashboard/sales', icon: ShoppingCart, label: 'Ventas', requiresStore: true };

  const getIsActive = (href: string, requiresStore?: boolean) => {
    if (requiresStore && !activeStore) return false;
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const NavIcon0 = navItems[0].icon;
  const NavIcon1 = navItems[1].icon;
  const NavIcon2 = navItems[2].icon;
  const NavIcon3 = navItems[3].icon;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-40 md:hidden">
      <div className="grid h-full grid-cols-5 items-center">
        {/* Item 1: Panel */}
        <Link
          href={navItems[0].href}
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium',
            getIsActive(navItems[0].href) ? 'text-primary' : 'text-muted-foreground',
            'hover:text-primary transition-colors'
          )}
        >
          <NavIcon0 className="h-5 w-5 mb-1" />
          <span>{navItems[0].label}</span>
        </Link>
        
        {/* Item 2: Productos */}
        <Link
          href={activeStore ? navItems[1].href : '#'}
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium',
            getIsActive(navItems[1].href, true) ? 'text-primary' : 'text-muted-foreground',
            'hover:text-primary transition-colors',
            !activeStore && 'opacity-50 pointer-events-none'
          )}
        >
          <NavIcon1 className="h-5 w-5 mb-1" />
          <span>{navItems[1].label}</span>
        </Link>
        
        {/* Item 3: Big Sales Button */}
        <div className="flex justify-center">
          <Button asChild size="icon" className={cn(
              "relative -mt-8 h-16 w-16 rounded-full shadow-lg",
              getIsActive(salesLink.href, true) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              !activeStore && 'opacity-50 pointer-events-none'
              )}
              disabled={!activeStore}
          >
            <Link href={activeStore ? salesLink.href : '#'}>
              <salesLink.icon className="h-7 w-7" />
              <span className="sr-only">{salesLink.label}</span>
            </Link>
          </Button>
        </div>

        {/* Item 4: Tiendas */}
        <Link
          href={navItems[2].href}
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium',
            getIsActive(navItems[2].href) ? 'text-primary' : 'text-muted-foreground',
            'hover:text-primary transition-colors'
          )}
        >
          <NavIcon2 className="h-5 w-5 mb-1" />
          <span>{navItems[2].label}</span>
        </Link>
        
        {/* Item 5: Ganancias */}
        <Link
          href={activeStore ? navItems[3].href : '#'}
          className={cn(
            'flex flex-col items-center justify-center h-full text-xs font-medium',
            getIsActive(navItems[3].href, true) ? 'text-primary' : 'text-muted-foreground',
            'hover:text-primary transition-colors',
            !activeStore && 'opacity-50 pointer-events-none'
          )}
        >
          <NavIcon3 className="h-5 w-5 mb-1" />
          <span>{navItems[3].label}</span>
        </Link>
      </div>
    </div>
  );
}
