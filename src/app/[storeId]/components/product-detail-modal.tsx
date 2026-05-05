"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import { Product } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShoppingCart, Package, Tag, Flame } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProductDetailModal({ product, isOpen, onOpenChange }: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (product) { setSelectedSize(null); setSelectedColor(null); }
  }, [product]);

  if (!product) return null;

  // Lógica de oferta
  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  const discount = hasOffer ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
  const displayPrice = hasOffer ? product.salePrice! : product.price;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({ variant: 'destructive', title: 'Selecciona una talla', description: 'Por favor, elige una talla antes de añadir al carrito.' });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({ variant: 'destructive', title: 'Selecciona un color', description: 'Por favor, elige un color antes de añadir al carrito.' });
      return;
    }
    // Al añadir al carrito usamos el precio de oferta si aplica
    const productToAdd = hasOffer ? { ...product, price: displayPrice } : product;
    addItem(productToAdd, selectedSize, selectedColor);
    toast({ title: "¡Añadido al carrito!", description: `${product.name} ha sido añadido a tu carrito.` });
    onOpenChange(false);
  };

  const colorMap: { [key: string]: string } = {
    'rojo': '#ef4444', 'azul': '#3b82f6', 'verde': '#22c55e', 'amarillo': '#facc15',
    'negro': '#111827', 'blanco': '#f9fafb', 'gris': '#9ca3af', 'rosa': '#f472b6',
    'naranja': '#f97316', 'morado': '#a855f7', 'café': '#92400e', 'beige': '#d9c9a3',
  };
  const getColorHex = (color: string) => colorMap[color.toLowerCase()] || color.toLowerCase();

  const needsSize = product.sizes && product.sizes.length > 0;
  const needsColor = product.colors && product.colors.length > 0;
  const canAddToCart = product.stock > 0 && (!needsSize || selectedSize) && (!needsColor || selectedColor);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <VisuallyHidden><DialogTitle>{product.name}</DialogTitle></VisuallyHidden>
      <DialogContent className="p-0 gap-0 max-w-3xl w-full overflow-hidden rounded-3xl border-0 shadow-2xl sm:max-h-[92vh] h-[95vh] sm:h-auto flex flex-col">
        <ScrollArea className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-0">

            {/* Imagen */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 md:min-h-[500px] min-h-[280px]">
              <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-8" data-ai-hint={product.imageHint} />
              {/* Badge oferta sobre imagen */}
              {hasOffer && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-orange-500 text-white border-0 font-bold text-sm shadow-lg flex items-center gap-1.5 px-3 py-1.5">
                    <Flame className="h-4 w-4" /> {product.saleLabel || "Oferta"} -{discount}%
                  </Badge>
                </div>
              )}
              <div className="absolute top-4 left-4 mt-0">
                {/* espacio para badge */}
              </div>
              <div className="absolute top-4 left-4">
                {!hasOffer && (
                  <Badge className="bg-white/90 backdrop-blur-sm text-amber-800 border border-amber-200 font-semibold shadow-sm px-3 py-1">
                    <Tag className="h-3 w-3 mr-1.5" />{product.category}
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-4 left-4">
                {product.stock > 0 ? (
                  <Badge className="bg-emerald-500/90 backdrop-blur-sm text-white border-0 text-xs font-semibold shadow-sm">
                    <Package className="h-3 w-3 mr-1.5" />{product.stock} en stock
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/90 backdrop-blur-sm text-white border-0 text-xs font-semibold shadow-sm">Agotado</Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col p-6 md:p-8 bg-white">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">{product.name}</h2>

              {/* Precio — con oferta o sin ella */}
              {hasOffer ? (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5 space-y-1">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" /> {product.saleLabel || "Precio de oferta"}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-orange-600">${displayPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    <span className="text-lg line-through text-gray-400">${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    <Badge className="bg-orange-500 text-white border-0 font-black">-{discount}%</Badge>
                  </div>
                  <p className="text-xs text-orange-600/70">Ahorras ${(product.price - displayPrice).toFixed(2)} MXN</p>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-4xl font-black text-amber-700">${displayPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  <span className="text-sm text-gray-400 font-medium">MXN</span>
                </div>
              )}

              <div className="h-px bg-gradient-to-r from-amber-200 via-amber-100 to-transparent mb-5" />

              {/* Descripción */}
              <div className="mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</p>
                <p className="text-gray-700 leading-relaxed text-sm">{product.description}</p>
              </div>

              {/* Colores */}
              {needsColor && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Color</p>
                    {selectedColor && <span className="text-xs font-semibold text-amber-700 capitalize bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{selectedColor}</span>}
                  </div>
                  <ToggleGroup type="single" value={selectedColor || ''} onValueChange={(v) => setSelectedColor(v || null)} className="flex flex-wrap gap-3 justify-start">
                    {product.colors!.map(color => (
                      <ToggleGroupItem key={color} value={color} aria-label={color}
                        className={cn("relative p-0 w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110",
                          selectedColor === color ? "border-amber-600 scale-110 shadow-lg" : "border-gray-200 hover:border-gray-400")}
                        style={{ backgroundColor: getColorHex(color) }}>
                        {selectedColor === color && <span className="absolute inset-0 flex items-center justify-center"><span className="w-2.5 h-2.5 rounded-full bg-white shadow" /></span>}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}

              {/* Tallas */}
              {needsSize && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Talla</p>
                    {selectedSize && <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Seleccionada: {selectedSize}</span>}
                  </div>
                  <ToggleGroup type="single" value={selectedSize || ''} onValueChange={(v) => setSelectedSize(v || null)} className="flex flex-wrap gap-2 justify-start">
                    {product.sizes!.map(size => (
                      <ToggleGroupItem key={size} value={size} aria-label={size}
                        className={cn("min-w-[44px] h-11 px-3 text-sm font-bold rounded-xl border-2 transition-all duration-200",
                          "data-[state=on]:bg-amber-700 data-[state=on]:text-white data-[state=on]:border-amber-700 data-[state=on]:shadow-md",
                          "data-[state=off]:bg-white data-[state=off]:text-gray-700 data-[state=off]:border-gray-200",
                          "hover:border-amber-400 hover:text-amber-700")}>
                        {size}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}

              {product.stock > 0 && ((needsSize && !selectedSize) || (needsColor && !selectedColor)) && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4 font-medium">
                  {needsColor && !selectedColor && needsSize && !selectedSize ? '👆 Selecciona un color y una talla para continuar'
                    : needsColor && !selectedColor ? '👆 Selecciona un color para continuar'
                    : '👆 Selecciona una talla para continuar'}
                </p>
              )}

              <div className="flex-1" />

              <Button onClick={handleAddToCart} size="lg" disabled={product.stock === 0}
                className={cn("w-full h-14 text-base font-bold rounded-2xl transition-all duration-300 mt-4",
                  canAddToCart ? "bg-amber-700 hover:bg-amber-800 text-white shadow-lg hover:shadow-amber-200 hover:shadow-xl active:scale-95"
                    : product.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-amber-100 text-amber-500 cursor-not-allowed")}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock === 0 ? 'Producto agotado' : 'Añadir al carrito'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}