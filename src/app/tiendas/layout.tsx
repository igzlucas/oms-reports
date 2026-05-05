
'use client';

import type { ReactNode } from "react";
import { Header } from "@/app/catalogo/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CartSheet } from "@/app/[storeId]/components/cart-sheet";

export default function TiendasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <CartSheet />
        <MobileBottomNav />
    </div>
  );
}
