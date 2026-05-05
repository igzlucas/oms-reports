"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Upload, X, Tag, Palette, Ruler, Package, DollarSign, ImageIcon, FileText, ChevronRight, Percent } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// ─── Configuración de categorías (igual que en add-product-modal) ─────────────
const CATEGORY_GROUPS = {
  moda: {
    label: "Moda y Accesorios", emoji: "👕",
    categories: ["Ropa y Accesorios", "Calzado", "Joyería y Relojes"],
    hasSizes: true, hasColors: true,
  },
  belleza: {
    label: "Belleza y Bienestar", emoji: "✨",
    categories: ["Belleza y Cuidado Personal", "Salud y Bienestar", "Bebés"],
    hasSizes: false, hasColors: true,
  },
  hogar: {
    label: "Hogar y Arte", emoji: "🏠",
    categories: ["Hogar y Jardín", "Arte y Manualidades"],
    hasSizes: false, hasColors: true,
  },
  deportes: {
    label: "Deportes y Tecnología", emoji: "⚽",
    categories: ["Deportes y Fitness", "Electrónica", "Juguetes y Juegos", "Vehículos y Accesorios"],
    hasSizes: false, hasColors: false,
  },
  otros: {
    label: "Alimentos y Otros", emoji: "🍎",
    categories: ["Alimentos y Bebidas", "Libros y Papelería", "Mascotas", "Otros"],
    hasSizes: false, hasColors: false,
  },
} as const;

function getCategoryConfig(category: string) {
  for (const group of Object.values(CATEGORY_GROUPS)) {
    if ((group.categories as readonly string[]).includes(category)) {
      return { hasSizes: group.hasSizes, hasColors: group.hasColors };
    }
  }
  return { hasSizes: false, hasColors: false };
}

const basicColors = ["Rojo", "Azul", "Verde", "Amarillo", "Blanco", "Negro", "Gris", "Rosa", "Naranja", "Morado", "Café", "Beige"];
const MAX_FILE_SIZE = 1 * 1024 * 1024;

const SALE_LABELS = ["Oferta", "Liquidación", "2x1", "Descuento", "Especial", "Promo"];

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().min(1, "La descripción es requerida.").max(300, "Máximo 300 caracteres."),
  costPrice: z.coerce.number().min(0),
  price: z.coerce.number().min(0.01, "El precio debe ser mayor que 0."),
  stock: z.coerce.number().int().min(0),
  category: z.string().min(1, "La categoría es requerida."),
  image: z.any().optional(),
  onSale: z.boolean().optional(),
  salePrice: z.coerce.number().min(0).optional(),
  saleLabel: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const watchedCategory = form.watch("category");
  const watchOnSale = form.watch("onSale");
  const { hasSizes, hasColors } = getCategoryConfig(watchedCategory);

  // Cargar datos del producto al abrir
  useEffect(() => {
    if (product && isOpen) {
      form.reset({
        name: product.name,
        description: product.description,
        costPrice: product.costPrice || 0,
        price: product.price,
        stock: product.stock,
        category: product.category,
        onSale: product.onSale || false,
        salePrice: product.salePrice || 0,
        saleLabel: product.saleLabel || "Oferta",
      });
      setSelectedColors(product.colors || []);
      setSelectedSizes(product.sizes || []);
      setImagePreview(product.imageUrl);
    }
  }, [product, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setImagePreview(product.imageUrl); return; }
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "Imagen muy grande", description: "El tamaño máximo es 1MB." });
      setImagePreview(product.imageUrl);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addColor = (color: string) => {
    const c = color.trim();
    if (c && !selectedColors.includes(c)) setSelectedColors(prev => [...prev, c]);
    setColorInput("");
  };

  const addSize = (size: string) => {
    const s = size.trim();
    if (s && !selectedSizes.includes(s)) setSelectedSizes(prev => [...prev, s]);
    setSizeInput("");
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!firestore) return;
    setIsLoading(true);

    let imageUrl = product.imageUrl;
    if (data.image && data.image.length > 0) {
      try {
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(data.image[0]);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
      } catch {
        toast({ variant: "destructive", title: "Error al procesar imagen" });
        setIsLoading(false);
        return;
      }
    }

    const productData = {
      ...product,
      name: data.name,
      description: data.description,
      costPrice: data.costPrice,
      price: data.price,
      stock: data.stock,
      category: data.category,
      imageUrl,
      sizes: hasSizes ? selectedSizes : [],
      colors: hasColors ? selectedColors : [],
      onSale: data.onSale || false,
      salePrice: data.onSale ? (data.salePrice || 0) : 0,
      saleLabel: data.onSale ? (data.saleLabel || "Oferta") : "",
    };

    const ref = doc(firestore, "products", product.id);
    setDoc(ref, productData, { merge: true }).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path, operation: 'update', requestResourceData: productData
      }));
    });

    toast({ title: "Producto actualizado", description: `${data.name} ha sido actualizado.` });
    setIsLoading(false);
    onClose();
  };

  const margin = form.watch("price") > 0 && form.watch("costPrice") >= 0
    ? (((form.watch("price") - form.watch("costPrice")) / form.watch("price")) * 100).toFixed(0)
    : null;

  const saleDiscount = watchOnSale && form.watch("price") > 0 && (form.watch("salePrice") || 0) > 0
    ? (((form.watch("price") - (form.watch("salePrice") || 0)) / form.watch("price")) * 100).toFixed(0)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl">

        {/* Header */}
        <div className="bg-amber-700 px-6 py-5">
          <DialogTitle className="text-white font-black text-xl">Editar Producto</DialogTitle>
          <DialogDescription className="text-amber-200 text-sm mt-0.5">
            Actualiza la información de <span className="font-semibold text-amber-100">{product.name}</span>
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="overflow-y-auto max-h-[72vh] px-6 py-5 space-y-5">

            {/* Info básica */}
            <SectionTitle icon={<FileText className="h-4 w-4" />} title="Información básica" />

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</Label>
              <Input {...form.register("name")} className="rounded-xl h-11" disabled={isLoading} />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</Label>
                <span className="text-xs text-gray-400">{form.watch("description")?.length || 0}/300</span>
              </div>
              <Textarea {...form.register("description")} className="rounded-xl resize-none min-h-[80px]" disabled={isLoading} />
              {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
            </div>

            {/* Imagen */}
            <SectionTitle icon={<ImageIcon className="h-4 w-4" />} title="Imagen del producto" />
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 shrink-0">
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  : <Upload className="h-6 w-6 text-gray-300 absolute inset-0 m-auto" />
                }
              </div>
              <div className="flex-1">
                <Input id="image" type="file" accept="image/*" {...form.register("image")} onChange={handleImageChange} disabled={isLoading} className="rounded-xl text-sm" />
                <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP. Máximo 1MB.</p>
              </div>
            </div>

            {/* Categoría */}
            <SectionTitle icon={<Tag className="h-4 w-4" />} title="Categoría" />
            <Select onValueChange={(v) => form.setValue("category", v, { shouldValidate: true })} value={form.watch("category")} disabled={isLoading}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="¿Qué tipo de producto es?" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {Object.values(CATEGORY_GROUPS).map((group) => (
                  <div key={group.label}>
                    <div className="px-2 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">{group.emoji} {group.label}</div>
                    {group.categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="pl-6">{cat}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>}

            {/* Variantes */}
            {watchedCategory && (hasSizes || hasColors) && (
              <>
                <SectionTitle icon={<Palette className="h-4 w-4" />} title="Variantes del producto" />

                {hasColors && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Colores <span className="text-gray-300 font-normal normal-case">(opcional)</span></Label>
                    <div className="flex flex-wrap gap-1.5">
                      {basicColors.map((color) => (
                        <button key={color} type="button" onClick={() => addColor(color)} disabled={selectedColors.includes(color)}
                          className={cn("text-xs px-2.5 py-1 rounded-lg border transition-all",
                            selectedColors.includes(color) ? "bg-amber-100 border-amber-300 text-amber-700 cursor-default" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"
                          )}>
                          {color}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Color personalizado..." value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addColor(colorInput); } }}
                        className="rounded-xl h-9 text-sm" disabled={isLoading} />
                      <Button type="button" variant="outline" size="sm" onClick={() => addColor(colorInput)} className="rounded-xl shrink-0">Añadir</Button>
                    </div>
                    {selectedColors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedColors.map((c) => (
                          <Badge key={c} className="bg-amber-50 text-amber-800 border border-amber-200 pr-1.5">
                            {c}
                            <button type="button" onClick={() => setSelectedColors(prev => prev.filter(x => x !== c))} className="ml-1.5"><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {hasSizes && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tallas <span className="text-gray-300 font-normal normal-case">(opcional)</span></Label>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Ropa:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => (
                          <button key={size} type="button" onClick={() => addSize(size)} disabled={selectedSizes.includes(size)}
                            className={cn("text-xs px-3 py-1 rounded-lg border font-medium transition-all",
                              selectedSizes.includes(size) ? "bg-amber-100 border-amber-300 text-amber-700 cursor-default" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"
                            )}>
                            {size}
                          </button>
                        ))}
                      </div>
                      {watchedCategory === "Calzado" && (
                        <>
                          <p className="text-xs text-gray-400">Calzado (MX):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {["22", "23", "24", "25", "26", "27", "28", "29", "30"].map((size) => (
                              <button key={size} type="button" onClick={() => addSize(size)} disabled={selectedSizes.includes(size)}
                                className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium transition-all",
                                  selectedSizes.includes(size) ? "bg-amber-100 border-amber-300 text-amber-700 cursor-default" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"
                                )}>
                                {size}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Talla personalizada..." value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSize(sizeInput); } }}
                        className="rounded-xl h-9 text-sm" disabled={isLoading} />
                      <Button type="button" variant="outline" size="sm" onClick={() => addSize(sizeInput)} className="rounded-xl shrink-0">Añadir</Button>
                    </div>
                    {selectedSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSizes.map((s) => (
                          <Badge key={s} className="bg-amber-50 text-amber-800 border border-amber-200 pr-1.5">
                            {s}
                            <button type="button" onClick={() => setSelectedSizes(prev => prev.filter(x => x !== s))} className="ml-1.5"><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Precio y stock */}
            <SectionTitle icon={<DollarSign className="h-4 w-4" />} title="Precio y stock" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio de costo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input type="number" step="0.01" {...form.register("costPrice")} className="pl-7 rounded-xl h-11" disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio de venta</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input type="number" step="0.01" {...form.register("price")} className="pl-7 rounded-xl h-11" disabled={isLoading} />
                </div>
                {form.formState.errors.price && <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>}
              </div>
            </div>

            {margin !== null && Number(margin) > 0 && (
              <div className={cn("flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium",
                Number(margin) >= 30 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                Number(margin) >= 15 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                "bg-red-50 text-red-600 border border-red-100"
              )}>
                <span>Margen de ganancia</span>
                <span className="font-black text-base">{margin}%</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Package className="h-3.5 w-3.5 inline mr-1.5" />Stock disponible
              </Label>
              <Input type="number" {...form.register("stock")} className="rounded-xl h-11" disabled={isLoading} />
            </div>

            {/* ── OFERTA ── */}
            <SectionTitle icon={<Percent className="h-4 w-4" />} title="Oferta o promoción" />

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Activar oferta</p>
                  <p className="text-xs text-gray-500 mt-0.5">Los clientes verán una etiqueta de oferta en este producto</p>
                </div>
                <Switch
                  checked={watchOnSale || false}
                  onCheckedChange={(v) => form.setValue("onSale", v)}
                  disabled={isLoading}
                />
              </div>

              {watchOnSale && (
                <div className="space-y-3 pt-2 border-t border-orange-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio de oferta</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input type="number" step="0.01" {...form.register("salePrice")} className="pl-7 rounded-xl h-11" disabled={isLoading}
                        placeholder={`Menor a $${form.watch("price") || 0}`} />
                    </div>
                    {saleDiscount && Number(saleDiscount) > 0 && (
                      <p className="text-xs text-emerald-600 font-semibold">
                        El cliente ahorra {saleDiscount}% — precio original ${form.watch("price")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Etiqueta de oferta</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SALE_LABELS.map((label) => (
                        <button key={label} type="button"
                          onClick={() => form.setValue("saleLabel", label)}
                          className={cn("text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all",
                            form.watch("saleLabel") === label
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"
                          )}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50/80 px-6 py-4 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl flex-1">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold">
              {isLoading
                ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                : <><ChevronRight className="mr-2 h-4 w-4" /> Guardar Cambios</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">{icon}</div>
      <span className="font-bold text-gray-800 text-sm">{title}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}