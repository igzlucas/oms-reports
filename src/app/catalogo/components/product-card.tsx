"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";
import { Tag, Flame, ShoppingBag } from "lucide-react";

const colorMap: { [key: string]: string } = {
  rojo: "bg-red-500",
  azul: "bg-blue-500",
  verde: "bg-green-500",
  amarillo: "bg-yellow-400",
  negro: "bg-gray-900",
  blanco: "bg-white border border-gray-200",
  gris: "bg-gray-400",
  rosa: "bg-pink-400",
  naranja: "bg-orange-500",
  morado: "bg-purple-500",
  café: "bg-amber-900",
  beige: "bg-amber-200",
};

export function ProductCard({ product }: { product: Product }) {
  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  const discount = hasOffer
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const displayPrice = hasOffer ? product.salePrice! : product.price;

  return (
    <Link href={`/catalogo/${product.id}`} className="block h-full group">
      <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-100/80 overflow-hidden card-hover card-shine relative">

        {/* Image area */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

          {/* Favorite button */}
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <FavoriteButton itemId={product.id} itemType="product" />
          </div>

          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-5 group-hover:scale-108 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
            data-ai-hint={product.imageHint}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick view */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-250">
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-3.5 py-1.5 rounded-full shadow-md border border-gray-100">
              <ShoppingBag className="h-3 w-3 text-amber-600" />
              Ver detalle
            </span>
          </div>

          {/* Badges top-left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasOffer ? (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[11px] font-bold shadow-md flex items-center gap-1 rounded-full px-2.5">
                <Flame className="h-3 w-3" /> -{discount}%
              </Badge>
            ) : (
              <Badge className="bg-white/90 text-gray-600 border border-gray-100/80 text-[11px] font-medium shadow-sm backdrop-blur-sm rounded-full px-2.5 flex items-center gap-1">
                <Tag className="h-2.5 w-2.5" />
                {product.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-col flex-grow p-5">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors duration-200">
            {product.name}
          </h3>

          {/* Color swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 mb-2">
              {product.colors.slice(0, 6).map((color) => (
                <span
                  key={color}
                  title={color}
                  className={`block h-3.5 w-3.5 rounded-full shadow-sm ring-1 ring-white ring-offset-1 ${colorMap[color.toLowerCase()] || ""}`}
                  style={!colorMap[color.toLowerCase()] ? { backgroundColor: color.toLowerCase() } : {}}
                />
              ))}
              {product.colors.length > 6 && (
                <span className="text-[10px] text-gray-400 font-medium">+{product.colors.length - 6}</span>
              )}
            </div>
          )}

          {/* Size chips */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {product.sizes.slice(0, 5).map((size) => (
                <span
                  key={size}
                  className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md"
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 5 && (
                <span className="text-[10px] text-gray-400">+{product.sizes.length - 5}</span>
              )}
            </div>
          )}

          {/* Price area */}
          <div className="mt-auto pt-4 border-t border-gray-50">
            {hasOffer ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-black text-orange-600">${displayPrice.toFixed(2)}</span>
                <span className="text-sm line-through text-gray-300">${product.price.toFixed(2)}</span>
                <Badge className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-bold rounded-full px-2 ml-auto">
                  {product.saleLabel || "Oferta"}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-amber-700">${product.price.toFixed(2)}</span>
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="text-[10px] text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    ¡Últimas unidades!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
