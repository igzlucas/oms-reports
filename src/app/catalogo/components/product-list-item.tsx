import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface ProductListItemProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export function ProductListItem({ product, onViewDetails }: ProductListItemProps) {
  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  const discount = hasOffer ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
  const displayPrice = hasOffer ? product.salePrice! : product.price;

  const content = (
    <div className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 hover:border-amber-200 hover:shadow-md transition-all duration-200 group">
      {/* Imagen compacta */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 bg-gray-50 rounded-xl overflow-hidden shrink-0">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={product.imageHint}
        />
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

          {/* Colores y tallas compactos */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              {product.colors.slice(0, 5).map((color) => {
                const colorMap: Record<string, string> = {
                  rojo: 'bg-red-500', azul: 'bg-blue-500', verde: 'bg-green-500',
                  amarillo: 'bg-yellow-400', negro: 'bg-gray-900', blanco: 'bg-white border border-gray-300',
                  gris: 'bg-gray-400', rosa: 'bg-pink-400', naranja: 'bg-orange-500',
                  morado: 'bg-purple-500', café: 'bg-amber-900', beige: 'bg-amber-200',
                };
                return (
                  <span key={color} title={color}
                    className={`h-3 w-3 rounded-full ${colorMap[color.toLowerCase()] || 'border border-gray-300'}`}
                    style={!colorMap[color.toLowerCase()] ? { backgroundColor: color.toLowerCase() } : {}} />
                );
              })}
              {product.colors.length > 5 && <span className="text-[10px] text-gray-400">+{product.colors.length - 5}</span>}
            </div>
          )}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.sizes.slice(0, 4).map(size => (
                <span key={size} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{size}</span>
              ))}
              {product.sizes.length > 4 && <span className="text-[10px] text-gray-400">+{product.sizes.length - 4}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {hasOffer ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-orange-600 text-base">${displayPrice.toFixed(2)}</span>
              <span className="text-xs line-through text-gray-400">${product.price.toFixed(2)}</span>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-bold px-1.5 py-0">
                {product.saleLabel || "Oferta"}
              </Badge>
            </div>
          ) : (
            <span className="font-black text-amber-700 text-base">${displayPrice.toFixed(2)}</span>
          )}
          <span className="text-[10px] text-gray-400">Stock: {product.stock}</span>
        </div>
      </div>
    </div>
  );

  if (onViewDetails) {
    return (
      <div onClick={() => onViewDetails(product)} className="block cursor-pointer">
        {content}
      </div>
    );
  }

  return (
    <Link href={`/catalogo/${product.id}`} className="block">
      {content}
    </Link>
  );
}