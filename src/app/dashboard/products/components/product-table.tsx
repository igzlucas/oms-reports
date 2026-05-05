"use client"

import { MoreHorizontal, PlusCircle, Search, Tag, Package, TrendingUp, AlertTriangle, Flame } from "lucide-react"
import { useState, useMemo } from "react"
import { collection, doc, where, query } from "firebase/firestore"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Product } from "@/lib/types"
import { useCollection, useFirebase } from "@/firebase"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { AddProductModal } from "./add-product-modal"
import { EditProductModal } from "./edit-product-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useDashboard } from "../../layout"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 8;

export function ProductTable() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  // ✅ FIX: "outOfStock" added as valid value
  const [statusFilter, setStatusFilter] = useState("all"); // all | onSale | lowStock | outOfStock
  const [page, setPage] = useState(1);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { activeStore } = useDashboard();

  const productsQuery = useMemo(() => {
    if (!user || !activeStore?.id) return null;
    return query(collection(firestore, "products"), where("storeId", "==", activeStore.id));
  }, [user, firestore, activeStore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.category))].filter(Boolean);
  }, [products]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, onSale: 0, lowStock: 0, outOfStock: 0 };
    return {
      total:      products.length,
      onSale:     products.filter(p => p.onSale).length,
      lowStock:   products.filter(p => p.stock > 0 && p.stock <= 3).length,
      outOfStock: products.filter(p => p.stock === 0).length,
    };
  }, [products]);

  // ✅ FIX: outOfStock case added to matchStatus
  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchStatus =
        statusFilter === "all"        ? true :
        statusFilter === "onSale"     ? p.onSale :
        statusFilter === "lowStock"   ? (p.stock > 0 && p.stock <= 3) :
        statusFilter === "outOfStock" ? p.stock === 0 :
        true;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const resetPage = () => setPage(1);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!activeStore) return;
    deleteDocumentNonBlocking(doc(firestore, "products", productId));
    toast({ title: "Producto eliminado" });
  };

  return (
    <>
      {activeStore && (
        <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} storeId={activeStore.id} />
      )}
      {selectedProduct && (
        <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={selectedProduct} />
      )}

      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Productos</h1>
            <p className="text-sm text-gray-500">Gestiona tu catálogo y controla el inventario</p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            disabled={!activeStore}
            className="bg-amber-700 hover:bg-amber-800 text-white rounded-2xl font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir Producto
          </Button>
        </div>

        {!activeStore ? (
          <Alert>
            <AlertTitle>No hay tienda activa</AlertTitle>
            <AlertDescription>
              <Link href="/dashboard/stores" className="font-bold underline">
                Selecciona o crea una tienda
              </Link>{" "}
              para gestionar productos.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* ── STAT CARDS — cada una filtra al hacer click ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Package className="h-4 w-4" />}
                label="Total"
                value={stats.total}
                color="blue"
                active={statusFilter === "all"}
                onClick={() => { setStatusFilter("all"); setPage(1); }}
              />
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label="En oferta"
                value={stats.onSale}
                color="orange"
                active={statusFilter === "onSale"}
                onClick={() => { setStatusFilter("onSale"); setPage(1); }}
              />
              <StatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Stock bajo"
                value={stats.lowStock}
                color="yellow"
                active={statusFilter === "lowStock"}
                onClick={() => { setStatusFilter("lowStock"); setPage(1); }}
              />
              {/* ✅ FIX: was setStatusFilter("all") — now correctly sets "outOfStock" */}
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Sin stock"
                value={stats.outOfStock}
                color="red"
                active={statusFilter === "outOfStock"}
                onClick={() => { setStatusFilter("outOfStock"); setPage(1); }}
              />
            </div>

            {/* Filtros de búsqueda y categoría */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <Input
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                  className="pl-9 rounded-xl h-10 bg-gray-50 border-gray-100 text-sm"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
                <SelectTrigger className="rounded-xl h-10 bg-gray-50 border-gray-100 text-sm sm:w-48">
                  <Tag className="h-3.5 w-3.5 mr-2 text-gray-400" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* ✅ FIX: "Sin stock" option added to the select */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                <SelectTrigger className="rounded-xl h-10 bg-gray-50 border-gray-100 text-sm sm:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="onSale">En oferta</SelectItem>
                  <SelectItem value="lowStock">Stock bajo (≤3)</SelectItem>
                  <SelectItem value="outOfStock">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {isLoading ? (
                <div className="text-center py-16 text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm">Cargando productos...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">Sin resultados</p>
                  <p className="text-gray-400 text-sm">Intenta cambiar los filtros o añade un producto</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="font-bold text-gray-600 pl-5">Producto</TableHead>
                        <TableHead className="font-bold text-gray-600">Categoría</TableHead>
                        <TableHead className="font-bold text-gray-600 hidden md:table-cell">Precio</TableHead>
                        <TableHead className="font-bold text-gray-600 hidden md:table-cell">Stock</TableHead>
                        <TableHead className="font-bold text-gray-600 hidden sm:table-cell">Estado</TableHead>
                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((product) => (
                        <TableRow key={product.id} className="hover:bg-amber-50/30 transition-colors">

                          {/* Producto */}
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</p>
                                {product.onSale && (
                                  <span className="text-xs text-orange-600 font-bold flex items-center gap-1 mt-0.5">
                                    <Flame className="h-3 w-3" /> {product.saleLabel || "Oferta"} — ${product.salePrice?.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Categoría */}
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-medium border-gray-200 text-gray-600">
                              {product.category}
                            </Badge>
                          </TableCell>

                          {/* Precio */}
                          <TableCell className="hidden md:table-cell">
                            {product.onSale && product.salePrice ? (
                              <div>
                                <span className="font-black text-orange-600">${product.salePrice.toFixed(2)}</span>
                                <span className="text-xs text-gray-400 line-through ml-1.5">${product.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
                            )}
                          </TableCell>

                          {/* Stock */}
                          <TableCell className="hidden md:table-cell">
                            <span className={cn("font-bold text-sm",
                              product.stock === 0 ? "text-red-500" :
                              product.stock <= 3  ? "text-amber-600" :
                                                    "text-gray-700"
                            )}>
                              {product.stock === 0 ? "Agotado" : product.stock}
                            </span>
                          </TableCell>

                          {/* Estado */}
                          <TableCell className="hidden sm:table-cell">
                            {product.onSale ? (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs font-bold">
                                <Flame className="h-3 w-3 mr-1" /> Oferta
                              </Badge>
                            ) : product.stock === 0 ? (
                              <Badge className="bg-red-100 text-red-600 border-red-200 text-xs">Sin stock</Badge>
                            ) : product.stock <= 3 ? (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Stock bajo</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Activo</Badge>
                            )}
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="pr-5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl">
                                <DropdownMenuLabel className="text-xs text-gray-400">Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditClick(product)} className="cursor-pointer">
                                  Editar producto
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditClick(product)} className="cursor-pointer text-orange-600">
                                  {product.onSale ? "Quitar oferta" : "Crear oferta"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="cursor-pointer text-red-500">
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginado */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="rounded-xl h-8 text-xs"
                        >
                          Anterior
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <Button
                            key={p}
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            className={cn(
                              "rounded-xl h-8 w-8 text-xs p-0",
                              p === page && "bg-amber-700 border-amber-700 hover:bg-amber-800"
                            )}
                          >
                            {p}
                          </Button>
                        ))}
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="rounded-xl h-8 text-xs"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Stat card — ✅ FIX: added `active` prop for visual selected state ──
function StatCard({
  icon, label, value, color, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const inactive: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300",
    orange: "bg-orange-50 text-orange-700 border-orange-100 hover:border-orange-300",
    yellow: "bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300",
    red:    "bg-red-50 text-red-700 border-red-100 hover:border-red-300",
  };
  const activeStyle: Record<string, string> = {
    blue:   "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400 ring-offset-1 shadow-sm",
    orange: "bg-orange-500 text-white border-orange-500 ring-2 ring-orange-300 ring-offset-1 shadow-sm",
    yellow: "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-300 ring-offset-1 shadow-sm",
    red:    "bg-red-500 text-white border-red-500 ring-2 ring-red-300 ring-offset-1 shadow-sm",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-sm w-full",
        active ? activeStyle[color] : inactive[color]
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className={cn("text-xs font-semibold", active && "text-white/80")}>{label}</span>
        </div>
        {active && (
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Activo</span>
        )}
      </div>
      <p className={cn("text-2xl font-black", active && "text-white")}>{value}</p>
    </button>
  );
}
