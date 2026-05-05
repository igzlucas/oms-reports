"use client";

import Image from "next/image";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Flame } from "lucide-react";
import { FavoriteButton } from "../../catalogo/components/favorite-button";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const colorMap: { [key: string]: string } = {
    'rojo': 'bg-red-500', 'azul': 'bg-blue-500', 'verde': 'bg-green-500',
    'amarillo': 'bg-yellow-400', 'negro': 'bg-black', 'blanco': 'bg-white border',
    'gris': 'bg-gray-400', 'rosa': 'bg-pink-400', 'naranja': 'bg-orange-500',
    'morado': 'bg-purple-500', 'café': 'bg-amber-900', 'beige': 'bg-amber-200',
  };

  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  const discount = hasOffer
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-lg cursor-pointer group" onClick={() => onViewDetails(product)}>
      <CardHeader className="p-0 border-b">
        <div className="relative aspect-square w-full">
          {/* Favorito */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton itemId={product.id} itemType="product" />
          </div>
          {/* Badge oferta */}
          {hasOffer && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-orange-500 text-white border-0 font-bold text-xs flex items-center gap-1 shadow-md">
                <Flame className="h-3 w-3" /> -{discount}%
              </Badge>
            </div>
          )}
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={product.imageHint} sizes="(max-width: 768px) 50vw, 33vw" />
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex-grow">
          <Badge variant="outline" className="mb-2">{product.category}</Badge>
          <CardTitle className="text-lg mb-1 leading-tight">{product.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</CardDescription>

          {/* Colores y tallas */}
          <div className="space-y-2 min-h-[28px] mb-2">
            {(product.colors && product.colors.length > 0) && (
              <div className="flex items-center gap-1.5">
                {product.colors.slice(0, 5).map((color) => (
                  <span key={color} title={color} className={`block h-4 w-4 rounded-full ${colorMap[color.toLowerCase()] || 'border'}`}
                    style={!colorMap[color.toLowerCase()] ? { backgroundColor: color.toLowerCase() } : {}} />
                ))}
                {product.colors.length > 5 && <span className="text-xs text-muted-foreground">+{product.colors.length - 5}</span>}
              </div>
            )}
            {(product.sizes && product.sizes.length > 0) && (
              <div className="flex flex-wrap items-center gap-1">
                {product.sizes.slice(0, 4).map((size) => (
                  <Badge key={size} variant="outline" className="px-1.5 py-0 text-xs font-normal">{size}</Badge>
                ))}
                {product.sizes.length > 4 && <span className="text-xs text-muted-foreground">+{product.sizes.length - 4}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-auto pt-2">Stock: {product.stock}</div>
      </CardContent>

      <CardFooter className="p-4 pt-2 flex justify-between items-center bg-slate-50">
        <div>
          {hasOffer ? (
            <div>
              <span className="text-xl font-black text-orange-600">${product.salePrice!.toFixed(2)}</span>
              <span className="text-sm line-through text-gray-400 ml-2">${product.price.toFixed(2)}</span>
            </div>
          ) : (
            <div className="text-xl font-bold text-primary">${product.price.toFixed(2)}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="h-4 w-4" /><span className="text-sm font-medium">Ver detalles</span>
        </div>
      </CardFooter>
    </Card>
  );
}