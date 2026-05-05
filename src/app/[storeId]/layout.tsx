'use client';

import type { ReactNode } from "react";
import { Header } from "@/app/catalogo/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CartSheet } from "./components/cart-sheet";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <CartSheet />
        <MobileBottomNav />
    </div>
  );
}
