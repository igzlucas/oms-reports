'use client';

import { useMemo } from 'react';
import Image from "next/image";
import { Plus, Minus, Trash2, Send, LoaderCircle, Flame, AlertTriangle } from "lucide-react";
import { doc } from 'firebase/firestore';

import { useCart } from "@/context/cart-context";
import { useUI, useDoc, useFirebase } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Store } from "@/lib/types";

export function CartSheet() {
  const { items, outOfStockItems, removeItem, updateItemQuantity, clearCart, clearOutOfStockItems } = useCart();
  const { isCartSheetOpen, closeCartSheet } = useUI();
  const { firestore } = useFirebase();

  const storeId = useMemo(() => items.length > 0 ? items[0].storeId : null, [items]);
  const storeRef = useMemo(() => {
    if (!firestore || !storeId) return null;
    return doc(firestore, 'stores', storeId);
  }, [firestore, storeId]);

  const { data: store, isLoading: isLoadingStore } = useDoc<Store>(storeRef);

  // Solo calcular total con items con stock
  const validItems = items.filter(item => !outOfStockItems.includes(item.cartItemId));
  const total = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasOutOfStock = outOfStockItems.length > 0;

  const handleSendOrder = () => {
    if (!store || hasOutOfStock) return;
    let message = `¡Hola ${store.name}! 👋 Me gustaría hacer el siguiente pedido:\n\n`;
    validItems.forEach(item => {
      message += `*Producto:* ${item.name}\n`;
      if (item.selectedColor) message += `*Color:* ${item.selectedColor}\n`;
      if (item.selectedSize) message += `*Talla:* ${item.selectedSize}\n`;
      message += `*Cantidad:* ${item.quantity}\n`;
      message += `*Precio Unit.:* $${item.price.toFixed(2)}\n`;
      message += `------------------------\n`;
    });
    message += `*Total del Pedido:* $${total.toFixed(2)}\n\n`;
    message += `¡Quedo a la espera de tu confirmación! Gracias.`;
    window.open(`https://wa.me/${store.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Sheet open={isCartSheetOpen} onOpenChange={closeCartSheet}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Tu Carrito de Compras</SheetTitle>
          <SheetDescription>
            {isLoadingStore && "Cargando tienda..."}
            {store && `Pedido para "${store.name}" — envíalo por WhatsApp.`}
            {!store && !isLoadingStore && items.length > 0 && "Error al cargar la tienda."}
          </SheetDescription>
        </SheetHeader>
        <Separator />

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Tu carrito está vacío.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3">

              {/* Aviso de productos sin stock */}
              {hasOutOfStock && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-700">Productos sin stock</p>
                    <p className="text-xs text-red-600 mt-0.5">Algunos productos ya no tienen stock. Elimínalos para continuar.</p>
                  </div>
                  <button onClick={clearOutOfStockItems} className="text-xs text-red-600 font-bold underline shrink-0 hover:text-red-800">
                    Eliminar
                  </button>
                </div>
              )}

              {items.map((item) => {
                const isOutOfStock = outOfStockItems.includes(item.cartItemId);
                return (
                  <div key={item.cartItemId}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isOutOfStock ? 'bg-red-50/50 border border-red-100 opacity-75' : ''}`}>

                    {/* Imagen */}
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="text-[9px] font-black text-red-700 bg-white/90 px-1 py-0.5 rounded">SIN STOCK</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm leading-tight truncate ${isOutOfStock ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                        {item.name}
                      </p>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {isOutOfStock ? (
                        <p className="text-xs text-red-600 font-semibold mt-0.5">Agotado — no disponible</p>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-sm font-bold text-amber-700">${item.price.toFixed(2)}</p>
                          {item.onSale && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                              <Flame className="h-2.5 w-2.5" /> Oferta
                            </Badge>
                          )}
                        </div>
                      )}

                      {!isOutOfStock && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.cartItemId, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.cartItemId, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(item.cartItemId)}>
                      <Trash2 className={`h-3.5 w-3.5 ${isOutOfStock ? 'text-red-500' : 'text-destructive'}`} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {items.length > 0 && (
          <SheetFooter className="mt-auto">
            <div className="w-full space-y-3">
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-amber-700 font-black">${total.toFixed(2)}</span>
              </div>
              {hasOutOfStock && (
                <p className="text-xs text-red-600 text-center font-medium">
                  Debes eliminar los productos sin stock antes de enviar el pedido.
                </p>
              )}
              <p className="text-xs text-gray-500 text-center px-4">
                <strong>Aviso:</strong> MiBazar es un intermediario. La transacción es directa con el vendedor.
              </p>
              <Button
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-2xl disabled:opacity-50"
                size="lg"
                onClick={handleSendOrder}
                disabled={isLoadingStore || !store || !store.whatsapp || hasOutOfStock || validItems.length === 0}
              >
                {isLoadingStore ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isLoadingStore ? 'Cargando...' : hasOutOfStock ? 'Elimina items sin stock' : 'Enviar Pedido por WhatsApp'}
              </Button>
              <Button variant="outline" className="w-full rounded-2xl" onClick={clearCart}>Vaciar Carrito</Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}