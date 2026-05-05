"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LoaderCircle, Plus, Trash2, Flame, ShoppingCart,
  Package, ChevronUp, ChevronDown, X
} from "lucide-react";
import { runTransaction, doc, collection, where, query } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirebase } from "@/firebase";
import { Product, SalesTicketItem } from "@/lib/types";

// ── Schema ──
const saleItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto."),
  quantity: z.coerce.number().min(1, "Mínimo 1."),
});

const createFormSchema = (products: Product[] | null) =>
  z.object({
    items: z
      .array(saleItemSchema)
      .min(1, "Añade al menos un producto.")
      .refine(
        items => new Set(items.map(i => i.productId)).size === items.length,
        { message: "No puedes duplicar el mismo producto.", path: ["root"] }
      ),
  }).refine(
    data => {
      if (!products) return true;
      return data.items.every(item => {
        const p = products.find(p => p.id === item.productId);
        return p ? item.quantity <= p.stock : true;
      });
    },
    { message: "Cantidad supera el stock disponible.", path: ["items"] }
  );

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onSaleAdded?: () => void;
}

export function AddSaleModal({ isOpen, onClose, storeId, onSaleAdded }: AddSaleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const productsQuery = useMemo(() => {
    if (!user || !storeId) return null;
    return query(collection(firestore, "products"), where("storeId", "==", storeId));
  }, [user, firestore, storeId]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const availableProducts = useMemo(
    () => products?.filter(p => p.stock > 0) ?? [],
    [products]
  );

  const formSchema = useMemo(() => createFormSchema(products ?? null), [products]);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { items: [{ productId: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = form.watch("items");

  const getEffectivePrice = useCallback((product: Product): number => {
    if (product.onSale && product.salePrice && product.salePrice > 0 && product.salePrice < product.price) {
      return product.salePrice;
    }
    return product.price;
  }, []);

  const calculateTotal = useCallback((items: FormValues["items"]) => {
    if (!products) return 0;
    return items.reduce((acc, item) => {
      const p = products.find(p => p.id === item.productId);
      return acc + (p ? getEffectivePrice(p) * (Number(item.quantity) || 0) : 0);
    }, 0);
  }, [products, getEffectivePrice]);

  useEffect(() => {
    const sub = form.watch(value => {
      setTotalAmount(calculateTotal((value.items ?? []) as FormValues["items"]));
    });
    return () => sub.unsubscribe();
  }, [form, calculateTotal]);

  useEffect(() => {
    if (isOpen) {
      form.reset({ items: [{ productId: "", quantity: 1 }] });
      setTotalAmount(0);
    }
  }, [isOpen, form]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!user || !firestore || !storeId) {
      toast({ variant: "destructive", title: "Error", description: "Error de autenticación." });
      return;
    }
    setIsLoading(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const saleTicketId = uuidv4();
        const saleItems: SalesTicketItem[] = [];

        for (const item of data.items) {
          const productRef = doc(firestore, "products", item.productId);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw new Error("Producto no encontrado.");
          const productData = productDoc.data() as Product;
          if (productData.stock < item.quantity)
            throw new Error(`Sin stock suficiente para ${productData.name}.`);
          transaction.update(productRef, { stock: productData.stock - item.quantity });
          saleItems.push({
            productId: productData.id,
            productName: productData.name,
            quantity: item.quantity,
            price: getEffectivePrice(productData),
            // store original price & label for promo detection on ticket
            originalPrice: productData.price,
            saleLabel: productData.saleLabel,
            onSale: productData.onSale ?? false,
          });
        }

        transaction.set(doc(firestore, `stores/${storeId}/saleTickets`, saleTicketId), {
          id: saleTicketId, storeId, ownerId: user.uid,
          ticketNumber: Date.now().toString(),
          totalSales: totalAmount,
          date: new Date().toISOString(),
          items: saleItems,
          status: "pending",
        });
      });

      toast({ title: "¡Venta Registrada!", description: "La venta y el stock han sido actualizados." });
      form.reset({ items: [{ productId: "", quantity: 1 }] });
      onSaleAdded?.();
      onClose();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Venta Fallida", description: error.message || "Error inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  const getProductForId = (id: string) => products?.find(p => p.id === id);
  const getProductStock = (id: string) => products?.find(p => p.id === id)?.stock ?? 0;
  const canSubmit = totalAmount > 0 && !isLoading && !isLoadingProducts;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        KEY FIX: On mobile we want a compact bottom-sheet-like modal.
        - No fixed height, max-h controlled with overflow on the items list only.
        - Uses flex column so footer is always visible.
      */}
      <DialogContent className="
        p-0 gap-0 border-0 shadow-2xl overflow-hidden
        w-full max-w-lg rounded-t-3xl rounded-b-none sm:rounded-3xl
        fixed bottom-0 sm:static sm:bottom-auto
        flex flex-col
        max-h-[92dvh] sm:max-h-[85vh]
      ">
        {/* ── HEADER (fixed, never scrolls) ── */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 px-5 py-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white font-black text-base leading-tight">
                  Nueva Venta
                </DialogTitle>
                <DialogDescription className="text-amber-100/75 text-xs mt-0.5">
                  Solo aparecen productos con stock disponible
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors mt-0.5 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">

          {/* ── SCROLLABLE BODY ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">

            {/* No products */}
            {!isLoadingProducts && availableProducts.length === 0 && (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-300" />
                </div>
                <p className="text-gray-500 font-semibold text-sm">Sin productos con stock</p>
                <p className="text-gray-400 text-xs">Actualiza el inventario para poder vender.</p>
              </div>
            )}

            {/* Product rows */}
            {fields.map((field, index) => {
              const selectedProduct = getProductForId(watchedItems[index]?.productId);
              const effectivePrice = selectedProduct ? getEffectivePrice(selectedProduct) : 0;
              const hasOffer = selectedProduct?.onSale &&
                selectedProduct.salePrice && selectedProduct.salePrice < selectedProduct.price;
              const maxStock = getProductStock(watchedItems[index]?.productId);
              const subtotal = effectivePrice * (Number(watchedItems[index]?.quantity) || 0);

              return (
                <div
                  key={field.id}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-2.5"
                >
                  {/* Row 1: select + delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Controller
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: cf }) => (
                          <Select
                            value={cf.value}
                            onValueChange={v => {
                              cf.onChange(v);
                              form.setValue(`items.${index}.quantity`, 1);
                              form.trigger(`items.${index}.productId`);
                            }}
                            disabled={isLoadingProducts}
                          >
                            <SelectTrigger className="rounded-xl h-10 bg-white border-gray-200 text-sm">
                              <SelectValue placeholder="Selecciona producto" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl max-h-52">
                              {isLoadingProducts
                                ? <SelectItem value="loading" disabled>Cargando…</SelectItem>
                                : availableProducts.map(p => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                      <span className="truncate max-w-[160px] text-sm">{p.name}</span>
                                      {p.onSale && p.salePrice && p.salePrice < p.price && (
                                        <Badge className="bg-orange-100 text-orange-600 border-0 text-[9px] px-1.5 py-0 shrink-0">
                                          <Flame className="h-2.5 w-2.5 mr-0.5" />${p.salePrice.toFixed(2)}
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-gray-400 shrink-0">({p.stock})</span>
                                    </div>
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Number(watchedItems[index]?.quantity) || 1;
                          if (cur > 1) form.setValue(`items.${index}.quantity`, cur - 1);
                        }}
                        disabled={!watchedItems[index]?.productId}
                        className="h-10 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        type="number"
                        min="1"
                        max={maxStock || 1}
                        {...form.register(`items.${index}.quantity`)}
                        disabled={!watchedItems[index]?.productId}
                        className="h-10 w-10 border-0 text-center text-sm font-bold p-0 rounded-none focus-visible:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Number(watchedItems[index]?.quantity) || 1;
                          if (cur < maxStock) form.setValue(`items.${index}.quantity`, cur + 1);
                        }}
                        disabled={!watchedItems[index]?.productId || Number(watchedItems[index]?.quantity) >= maxStock}
                        className="h-10 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="h-10 w-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 transition-all shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Row 2: price info + subtotal */}
                  {selectedProduct && (
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        {hasOffer ? (
                          <>
                            <Flame className="h-3 w-3 text-orange-500 shrink-0" />
                            <span className="text-xs text-orange-600 font-bold">${effectivePrice.toFixed(2)} c/u</span>
                            <span className="text-xs line-through text-gray-300">${selectedProduct.price.toFixed(2)}</span>
                            <Badge className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] px-1.5 rounded-full">
                              {selectedProduct.saleLabel || "Oferta"}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">${effectivePrice.toFixed(2)} c/u · Stock: {maxStock}</span>
                        )}
                      </div>
                      {Number(watchedItems[index]?.quantity) > 0 && (
                        <span className="text-xs font-bold text-amber-700">${subtotal.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {/* Errors */}
                  {form.formState.errors.items?.[index]?.productId && (
                    <p className="text-xs text-red-500 px-1">{form.formState.errors.items[index]?.productId?.message}</p>
                  )}
                </div>
              );
            })}

            {form.formState.errors.items?.root && (
              <p className="text-sm text-red-500 text-center">{form.formState.errors.items.root.message}</p>
            )}

            {/* Add product */}
            {availableProducts.length > 0 && (
              <button
                type="button"
                onClick={() => append({ productId: "", quantity: 1 })}
                className="w-full h-10 rounded-2xl border border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-400 hover:text-amber-700 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" /> Añadir producto
              </button>
            )}
          </div>

          {/* ── FOOTER (fixed, always visible) ── */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-4 pb-safe pt-3 pb-4 space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2.5">
              <span className="font-bold text-gray-700 text-sm">Total de la venta</span>
              <span className="text-xl font-black text-amber-700">${totalAmount.toFixed(2)}</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-2xl h-11 border-gray-200 font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 rounded-2xl h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-0 shadow-sm disabled:opacity-40"
              >
                {isLoading
                  ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Registrando…</>
                  : <><ShoppingCart className="mr-2 h-4 w-4" />Registrar Venta</>
                }
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
