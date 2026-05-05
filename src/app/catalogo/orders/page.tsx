'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc } from 'firebase/firestore';
import { Plus, Minus, Trash2, Send, ShoppingCart, LoaderCircle, ArrowLeft, Store as StoreIcon, Flame, AlertTriangle } from 'lucide-react';

import { useCart } from '@/context/cart-context';
import { useFirebase, useDoc } from '@/firebase';
import type { Store } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function OrdersPage() {
  const { items, outOfStockItems, removeItem, updateItemQuantity, clearCart, clearOutOfStockItems } = useCart();
  const { firestore } = useFirebase();

  const storeId = useMemo(() => (items.length > 0 ? items[0].storeId : null), [items]);
  const storeRef = useMemo(() => {
    if (!firestore || !storeId) return null;
    return doc(firestore, 'stores', storeId);
  }, [firestore, storeId]);

  const { data: store, isLoading: isLoadingStore } = useDoc<Store>(storeRef);

  const validItems = items.filter(item => !outOfStockItems.includes(item.cartItemId));
  const total = useMemo(() => validItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [validItems]);
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-500 mb-8">Explora el catálogo y añade productos que te gusten.</p>
          <Button asChild className="bg-amber-700 hover:bg-amber-800 text-white rounded-2xl h-12 px-8 font-bold">
            <Link href="/catalogo"><ArrowLeft className="mr-2 h-4 w-4" />Ir al Catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="container max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/catalogo"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Mi Pedido</h1>
            <p className="text-sm text-gray-500">{items.length} producto{items.length !== 1 ? 's' : ''} en tu carrito</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Aviso sin stock */}
          {hasOutOfStock && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-700 text-sm">Productos sin stock disponible</p>
                <p className="text-xs text-red-600 mt-1">
                  {outOfStockItems.length} producto{outOfStockItems.length !== 1 ? 's' : ''} en tu carrito {outOfStockItems.length !== 1 ? 'están agotados' : 'está agotado'}.
                  Debes eliminarlos para poder enviar tu pedido.
                </p>
              </div>
              <Button onClick={clearOutOfStockItems} size="sm" variant="outline"
                className="shrink-0 border-red-300 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold">
                Eliminar agotados
              </Button>
            </div>
          )}

          {/* Info tienda */}
          {store && !isLoadingStore && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3">
              <StoreIcon className="h-4 w-4 text-amber-700 shrink-0" />
              <p className="text-sm text-amber-800">
                Estás comprando en{' '}
                <Link href={`/${store.slug}`} className="font-bold hover:underline">{store.name}</Link>
              </p>
            </div>
          )}
          {isLoadingStore && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 flex items-center gap-3">
              <LoaderCircle className="h-4 w-4 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-400">Cargando información de la tienda...</p>
            </div>
          )}

          {/* Lista de productos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {items.map((item, index) => {
              const isOutOfStock = outOfStockItems.includes(item.cartItemId);
              return (
                <div key={item.cartItemId}>
                  <div className={`flex items-center gap-4 p-5 ${isOutOfStock ? 'bg-red-50/30' : ''}`}>
                    {/* Imagen */}
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="text-[9px] font-black text-red-700 bg-white/90 px-1 py-0.5 rounded">AGOTADO</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isOutOfStock ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                        {item.name}
                      </p>
                      {(item.selectedColor || item.selectedSize) && (
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {isOutOfStock ? (
                        <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Sin stock — elimina este producto
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-bold text-amber-700">${item.price.toFixed(2)}</p>
                            {item.onSale && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                                <Flame className="h-2.5 w-2.5" /> Oferta
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateItemQuantity(item.cartItemId, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                              <Minus className="h-3 w-3 text-gray-600" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateItemQuantity(item.cartItemId, item.quantity + 1)} disabled={item.quantity >= item.stock}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40">
                              <Plus className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {!isOutOfStock && (
                        <p className="font-black text-gray-900 text-base">
                          ${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <button onClick={() => removeItem(item.cartItemId)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isOutOfStock ? 'bg-red-100 hover:bg-red-200' : 'bg-red-50 hover:bg-red-100'}`}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator className="mx-5" />}
                </div>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Resumen del pedido</h3>
            <div className="space-y-2">
              {validItems.map(item => (
                <div key={item.cartItemId} className="flex justify-between text-sm text-gray-500">
                  <span className="truncate mr-4">
                    {item.name} × {item.quantity}
                    {item.onSale && <span className="ml-1 text-orange-500 text-xs font-bold">🔥</span>}
                  </span>
                  <span className="shrink-0">${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              {hasOutOfStock && outOfStockItems.map(id => {
                const item = items.find(i => i.cartItemId === id);
                return item ? (
                  <div key={id} className="flex justify-between text-sm text-red-400 line-through">
                    <span className="truncate mr-4">{item.name} (sin stock)</span>
                    <span>—</span>
                  </div>
                ) : null;
              })}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-lg">Total</span>
              <span className="font-black text-2xl text-amber-700">
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {hasOutOfStock && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                No puedes enviar el pedido mientras haya productos sin stock.
              </div>
            )}

            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 leading-relaxed">
              <strong>Aviso:</strong> MiBazar es un intermediario. La transacción será directa con el vendedor vía WhatsApp.
            </p>

            <Button size="lg" onClick={handleSendOrder}
              disabled={isLoadingStore || !store || !store.whatsapp || hasOutOfStock || validItems.length === 0}
              className="w-full h-14 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-2xl text-base shadow-lg disabled:opacity-50">
              {isLoadingStore
                ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Cargando...</>
                : hasOutOfStock
                ? <><AlertTriangle className="mr-2 h-5 w-5" />Elimina items sin stock</>
                : <><Send className="mr-2 h-5 w-5" />Enviar Pedido por WhatsApp</>
              }
            </Button>

            <Button variant="ghost" onClick={clearCart} className="w-full rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />Vaciar carrito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}