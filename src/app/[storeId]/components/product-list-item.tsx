'use client';

import Image from "next/image";
import { Eye, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";

interface Props {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export function ProductListItem({ product, onViewDetails }: Props) {
  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  const discount = hasOffer ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
  const displayPrice = hasOffer ? product.salePrice! : product.price;

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 cursor-pointer hover:border-amber-200 hover:shadow-md transition-all duration-200 group"
    >
      {/* Imagen compacta */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 bg-gray-50 rounded-xl overflow-hidden shrink-0">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        {hasOffer && (
          <div className="absolute top-1 left-1">
            <Badge className="bg-orange-500 text-white border-0 text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-0.5">
              <Flame className="h-2.5 w-2.5" /> -{discount}%
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-amber-700 transition-colors">
              {product.name}
            </p>
            <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500 shrink-0 px-1.5">{product.category}</Badge>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Precio */}
          <div>
            {hasOffer ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-orange-600 text-base">${displayPrice.toFixed(2)}</span>
                <span className="text-xs line-through text-gray-400">${product.price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="font-black text-amber-700 text-base">${displayPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Ver detalles */}
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-700 transition-colors">
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ver</span>
          </button>
        </div>
      </div>
    </div>
  );
}