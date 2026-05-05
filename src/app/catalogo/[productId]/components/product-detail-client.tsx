'use client';

import { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Product, Store } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MessageCircle, Store as StoreIcon, Tag, Package, ChevronRight, Flame, AlertTriangle } from "lucide-react";
import { ProductCard } from "../../components/product-card";
import { FavoriteButton } from "../../components/favorite-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailClientProps {
  product: Product;
  store: Store | null;
  suggestedProducts: Product[];
}

const colorMap: { [key: string]: string } = {
  rojo: "bg-red-500", azul: "bg-blue-500", verde: "bg-green-500",
  amarillo: "bg-yellow-400", negro: "bg-gray-900", blanco: "bg-white border border-gray-300",
  gris: "bg-gray-400", rosa: "bg-pink-400", naranja: "bg-orange-500",
  morado: "bg-purple-500", café: "bg-amber-900", beige: "bg-amber-200",
};

export function ProductDetailClient({ product, store, suggestedProducts }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { toast } = useToast();

  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  const discount = hasOffer ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
  const displayPrice = hasOffer ? product.salePrice! : product.price;
  const outOfStock = product.stock === 0;

  const handleWhatsAppContact = () => {
    if (outOfStock) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({ variant: 'destructive', title: 'Selecciona una talla', description: 'Por favor, elige una talla antes de contactar.' });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({ variant: 'destructive', title: 'Selecciona un color', description: 'Por favor, elige un color antes de contactar.' });
      return;
    }
    let message = `¡Hola! Estoy interesado en este producto que vi en Mi Bazar:\n\n`;
    message += `*Producto:* ${product.name}\n`;
    message += `*Precio:* $${displayPrice.toFixed(2)}${hasOffer ? ` (oferta, precio original: $${product.price.toFixed(2)})` : ''}\n`;
    if (selectedSize) message += `*Talla:* ${selectedSize}\n`;
    if (selectedColor) message += `*Color:* ${selectedColor}\n`;
    message += `\n*Enlace:* ${window.location.href}`;

    const whatsappLink = store?.whatsapp
      ? `https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      : null;
    if (whatsappLink) window.open(whatsappLink, '_blank');
  };

  const descriptionParagraphs = product.description
    ? product.description.split(/\n+/).map(p => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/catalogo" className="hover:text-amber-600 transition-colors">Catálogo</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-500">{product.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">

            {/* Imagen */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm group">
                {hasOffer && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-orange-500 text-white border-0 font-bold text-sm shadow-lg flex items-center gap-1.5 px-3 py-1.5">
                      <Flame className="h-4 w-4" /> {product.saleLabel || "Oferta"} -{discount}%
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <FavoriteButton itemId={product.id} itemType="product" />
                </div>
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className={`object-cover transition-transform duration-500 ${outOfStock ? 'grayscale opacity-60' : 'group-hover:scale-103'}`}
                  data-ai-hint={product.imageHint}
                />
                {/* Overlay agotado sobre imagen */}
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="bg-red-600 text-white font-black text-xl px-6 py-3 rounded-2xl shadow-2xl rotate-[-8deg] flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> AGOTADO
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    <Tag className="h-3 w-3 mr-1" />{product.category}
                  </Badge>
                  {outOfStock ? (
                    <Badge className="bg-red-100 text-red-700 border border-red-200 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Sin stock
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      <Package className="h-3 w-3 mr-1" />{product.stock} en stock
                    </Badge>
                  )}
                  {hasOffer && (
                    <Badge className="bg-orange-500 text-white border-0 font-bold flex items-center gap-1">
                      <Flame className="h-3 w-3" /> {product.saleLabel || "Oferta"}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Tienda */}
                {store && (
                  <Link href={`/${store.slug}`} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 -mt-2 hover:border-amber-200 hover:shadow-md transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <StoreIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Vendido por</p>
                      <p className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors truncate">{store.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </Link>
                )}
              </div>

              {/* Precio */}
              {hasOffer ? (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-1">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" /> Precio de oferta
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-orange-600">${displayPrice.toFixed(2)}</span>
                    <span className="text-lg line-through text-gray-400">${product.price.toFixed(2)}</span>
                    <Badge className="bg-orange-500 text-white border-0 font-black text-sm">-{discount}%</Badge>
                  </div>
                  <p className="text-xs text-orange-600/70">
                    Ahorras ${(product.price - displayPrice).toFixed(2)} MXN con esta oferta
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-amber-700">${displayPrice.toFixed(2)}</span>
                  <span className="text-sm text-gray-400">MXN</span>
                </div>
              )}

              <Separator />

              {/* Descripción */}
              {descriptionParagraphs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Descripción</h3>
                  <div className="space-y-2">
                    {descriptionParagraphs.map((para, i) => (
                      <p key={i} className="text-gray-600 leading-relaxed text-[15px]">{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Colores — deshabilitados si sin stock */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Color{selectedColor && <span className="ml-2 text-amber-700 normal-case font-semibold">— {selectedColor}</span>}
                  </h3>
                  <ToggleGroup
                    type="single"
                    value={selectedColor || ''}
                    onValueChange={(v) => !outOfStock && setSelectedColor(v || null)}
                    className="flex flex-wrap gap-2 justify-start"
                    disabled={outOfStock}
                  >
                    {product.colors.map(color => (
                      <ToggleGroupItem key={color} value={color} aria-label={color}
                        className="p-0.5 border-2 border-transparent data-[state=on]:border-amber-500 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <span title={color}
                          className={`block h-9 w-9 rounded-full shadow-sm ${colorMap[color.toLowerCase()] || 'border border-gray-200'} ${outOfStock ? 'grayscale opacity-50' : ''}`}
                          style={!colorMap[color.toLowerCase()] ? { backgroundColor: color.toLowerCase() } : {}} />
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}

              {/* Tallas — deshabilitadas si sin stock */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Talla</h3>
                  <ToggleGroup
                    type="single"
                    value={selectedSize || ''}
                    onValueChange={(v) => !outOfStock && setSelectedSize(v || null)}
                    className="flex flex-wrap gap-2 justify-start"
                    disabled={outOfStock}
                  >
                    {product.sizes.map(size => (
                      <ToggleGroupItem key={size} value={size} aria-label={size}
                        className="h-10 px-4 text-sm font-semibold rounded-xl border-2 data-[state=on]:border-amber-500 data-[state=on]:bg-amber-50 data-[state=on]:text-amber-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {size}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2">
                {outOfStock ? (
                  /* Producto sin stock */
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      <div>
                        <p className="font-bold text-red-700 text-sm">Producto agotado</p>
                        <p className="text-xs text-red-600 mt-0.5">Este producto no tiene stock disponible en este momento.</p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      disabled
                      className="w-full h-14 rounded-2xl bg-gray-200 text-gray-400 font-bold text-base cursor-not-allowed border-0"
                    >
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Sin stock disponible
                    </Button>
                  </div>
                ) : store?.whatsapp ? (
                  <>
                    <p className="text-xs text-gray-500 text-center mb-3 px-4">
                      <strong>Aviso:</strong> Actuamos solo como intermediarios. Al contactar, la transacción es directamente con el vendedor.
                    </p>
                    <Button
                      onClick={handleWhatsAppContact}
                      size="lg"
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-base shadow-lg shadow-amber-200 border-0 transition-all hover:scale-[1.02]"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Contactar por WhatsApp
                    </Button>
                  </>
                ) : (
                  <Button size="lg" className="w-full h-14 rounded-2xl" disabled>
                    Contacto no disponible
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Productos sugeridos */}
          {suggestedProducts.length > 0 && (
            <div className="mt-20">
              <Separator className="mb-12" />
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-amber-600 font-bold uppercase tracking-widest text-xs mb-1">Más productos</p>
                  <h2 className="text-2xl font-black text-gray-900">También te podría interesar</h2>
                </div>
                <Link href="/catalogo">
                  <Button variant="ghost" className="text-amber-700 hover:bg-amber-50 font-semibold rounded-xl text-sm">
                    Ver catálogo <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}