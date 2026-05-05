"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LayoutGrid, List, Star, Package, MessageCircle,
  Facebook, Instagram, Twitter, ShieldCheck, Search, SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/app/catalogo/components/favorite-button";
import { Store, Product, Rating } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductListItem } from "@/app/catalogo/components/product-list-item";
import { ProductDetailModal } from "./product-detail-modal";
import { StoreReviews } from "./store-reviews";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function StorePageContent({ store, initialProducts }: { store: Store; initialProducts: Product[] }) {
  const { firestore } = useFirebase();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const reviewsQuery = useMemo(() => {
    if (!firestore || !store.id) return null;
    return query(collection(firestore, "stores", store.id, "ratings"), orderBy("date", "desc"));
  }, [firestore, store.id]);

  const { data: reviews } = useCollection<Rating>(reviewsQuery);

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1));
  }, [reviews]);

  const categories = useMemo(() => Array.from(new Set(initialProducts.map((p) => p.category))), [initialProducts]);
  const maxPrice = useMemo(() => Math.max(...initialProducts.map((p) => p.price), 0), [initialProducts]);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(store.bannerUrl || null);

  useEffect(() => { setPriceRange([0, maxPrice]); }, [maxPrice]);
  useEffect(() => {
    if (!store.bannerUrl) setBannerImageUrl(`https://picsum.photos/seed/${store.id}/1200/400`);
  }, [store.bannerUrl, store.id]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => (
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())) &&
      (category === "all" || p.category === category) &&
      p.price >= priceRange[0] && p.price <= priceRange[1]
    ));
  }, [initialProducts, search, category, priceRange]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <ProductDetailModal product={viewingProduct} isOpen={!!viewingProduct} onOpenChange={(open) => { if (!open) setViewingProduct(null); }} />

      {/* ── BANNER ── */}
      <div className="relative h-72 md:h-96 w-full bg-cover bg-center bg-gray-900 overflow-hidden"
        style={{ backgroundImage: bannerImageUrl ? `url(${bannerImageUrl})` : "none" }}>
        {/* Overlay con gradiente elegante */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        {/* Botón favorito */}
        <div className="absolute top-4 right-4 z-10">
          <FavoriteButton itemId={store.id} itemType="store" />
        </div>

        {/* Contenido centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 text-center px-6">
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm mb-4 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Tienda Verificada
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl uppercase mb-3">
            {store.name}
          </h1>
          <p className="text-white/70 max-w-xl text-base leading-relaxed">{store.description}</p>

          {/* Redes sociales */}
          <div className="mt-5 flex items-center gap-2">
            {store.socials?.facebook && (
              <a href={store.socials.facebook} target="_blank" rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {store.socials?.instagram && (
              <a href={store.socials.instagram} target="_blank" rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {store.socials?.x && (
              <a href={store.socials.x} target="_blank" rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110">
                <Twitter className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

        {/* ── SIDEBAR ── */}
        <aside className="space-y-5 lg:sticky lg:top-6 self-start">

          {/* Rating Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Calificación</h3>
              <Badge variant="outline" className="text-xs font-medium">{reviews?.length || 0} reseñas</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-black text-amber-600">{averageRating || "—"}</div>
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={cn("h-4 w-4", averageRating >= s ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">de 5 estrellas</p>
              </div>
            </div>
            {/* Barras de rating */}
            {[5,4,3,2,1].map(star => {
              const count = reviews?.filter(r => Math.floor(r.rating) === star).length || 0;
              const pct = reviews?.length ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-3 text-right">{star}</span>
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300 shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              <h3 className="font-bold text-gray-900">Filtros</h3>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl h-11 bg-gray-50 border-gray-100 focus-visible:ring-amber-500"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-gray-100">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Precio */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</label>
                <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-xs font-bold">
                  ${priceRange[0]} – ${priceRange[1]}
                </Badge>
              </div>
              <Slider
                value={priceRange}
                min={0}
                max={maxPrice}
                step={1}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                className="py-1"
              />
            </div>

            {/* Reset */}
            {(search || category !== "all" || priceRange[1] !== maxPrice) && (
              <Button variant="ghost" size="sm" className="w-full rounded-xl text-gray-400 hover:text-gray-600"
                onClick={() => { setSearch(""); setCategory("all"); setPriceRange([0, maxPrice]); }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main>
          <Tabs defaultValue="products" className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <TabsList className="bg-white border border-gray-100 rounded-2xl p-1.5 h-auto shadow-sm w-full sm:w-auto">
                <TabsTrigger value="products" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-semibold text-sm transition-all duration-200">
                  <Package className="h-4 w-4 mr-2" /> Catálogo
                  {filteredProducts.length > 0 && (
                    <Badge className="ml-2 bg-amber-100 text-amber-700 border-0 text-xs font-bold">{filteredProducts.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-semibold text-sm transition-all duration-200">
                  <MessageCircle className="h-4 w-4 mr-2" /> Opiniones
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => setView("grid")}
                  className={cn("rounded-xl h-9 w-9 transition-all", view === "grid" ? "bg-amber-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setView("list")}
                  className={cn("rounded-xl h-9 w-9 transition-all", view === "list" ? "bg-amber-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="products" className="mt-0">
              {filteredProducts.length > 0 ? (
                view === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                    {filteredProducts.map((p) => <ProductCard key={p.id} product={p} onViewDetails={setViewingProduct} />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((p) => <ProductListItem key={p.id} product={p} onViewDetails={setViewingProduct} />)}
                  </div>
                )
              ) : (
                <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
                  <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold text-lg mb-1">Sin resultados</p>
                  <p className="text-gray-300 text-sm mb-6">Intenta ajustar tus filtros.</p>
                  <Button variant="outline" className="rounded-xl" onClick={() => { setSearch(""); setCategory("all"); setPriceRange([0, maxPrice]); }}>
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <StoreReviews store={store} reviews={reviews} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export function StorePageClient({ store, initialProducts }: { store: Store; initialProducts: Product[] }) {
  return <StorePageContent store={store} initialProducts={initialProducts} />;
}
