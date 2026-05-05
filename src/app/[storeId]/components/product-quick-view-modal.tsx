"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { Product } from "@/lib/types";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickViewModal({ product, open, onOpenChange }: Props) {
  const { addItem } = useCart();

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 max-h-[70vh]">
          {/* IMAGE */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* INFO */}
          <div className="space-y-4">
            <Badge>{product.category}</Badge>

            <p className="text-2xl font-bold text-amber-700">
              ${product.price.toFixed(2)}
            </p>

            {product.description && (
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            )}

            <Button
              className="w-full bg-amber-700 hover:bg-amber-800"
              onClick={() => addItem(product)}
            >
              Agregar al carrito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
