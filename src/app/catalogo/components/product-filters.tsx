"use client";

import { useState, useMemo } from "react";
import {
  Search, LayoutGrid, List, MapPin, Tag,
  SlidersHorizontal, X, Flame, ChevronDown, ChevronUp
} from "lucide-react";
import { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProductCard } from "./product-card";
import { ProductListItem } from "./product-list-item";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  initialProducts: Product[];
  categories: string[];
  states: string[];
  municipalitiesByState: Record<string, string[]>;
}

export function ProductFilters({
  initialProducts,
  categories,
  states,
  municipalitiesByState,
}: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchInput, setSearchInput] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [showCategories, setShowCategories] = useState(true);

  const prices = initialProducts.map(p => p.price).filter(Boolean);
  const maxPrice = prices.length ? Math.max(...prices) : 10000;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const [price, setPrice] = useState(maxPrice);

  // Has active filters indicator
  const hasFilters = searchInput || selectedState || selectedMunicipality ||
    selectedCategories.length > 0 || onSaleOnly || price < maxPrice;

  const clearFilters = () => {
    setSearchInput("");
    setSelectedState("");
    setSelectedMunicipality("");
    setSelectedCategories([]);
    setOnSaleOnly(false);
    setPrice(maxPrice);
  };

  // Active filter badge list for UX
  const activeFilterBadges: { label: string; onRemove: () => void }[] = [
    ...(selectedState ? [{ label: selectedState, onRemove: () => { setSelectedState(""); setSelectedMunicipality(""); } }] : []),
    ...(selectedMunicipality ? [{ label: selectedMunicipality, onRemove: () => setSelectedMunicipality("") }] : []),
    ...selectedCategories.map(cat => ({ label: cat, onRemove: () => setSelectedCategories(prev => prev.filter(c => c !== cat)) })),
    ...(onSaleOnly ? [{ label: "En oferta", onRemove: () => setOnSaleOnly(false) }] : []),
    ...(price < maxPrice ? [{ label: `≤ $${price.toLocaleString()}`, onRemove: () => setPrice(maxPrice) }] : []),
  ];

  const products = useMemo(
    () => initialProducts.map(p => ({ ...p, nameLower: p.name.toLowerCase() })),
    [initialProducts]
  );

  const filteredProducts = useMemo(() => {
    const search = searchInput.toLowerCase();
    return products.filter(p => {
      if (selectedCategories.length && !selectedCategories.includes(p.category)) return false;
      if (search && !p.nameLower.includes(search)) return false;
      if (selectedState && p.store?.state !== selectedState) return false;
      if (selectedMunicipality && p.store?.municipality !== selectedMunicipality) return false;
      if (p.price > price) return false;
      if (onSaleOnly && !p.onSale) return false;
      return true;
    });
  }, [products, searchInput, selectedCategories, selectedState, selectedMunicipality, price, onSaleOnly]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value === "all-states" ? "" : value);
    setSelectedMunicipality("");
  };

  const handleMunicipalityChange = (value: string) => {
    setSelectedMunicipality(value === "all-municipalities" ? "" : value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

      {/* ── SIDEBAR FILTROS — style matches stores-filters ── */}
      <aside className="lg:sticky lg:top-24 bg-white border border-gray-100 rounded-3xl p-5 space-y-5 shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Filtros</h2>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Buscar producto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <Input
              placeholder="Nombre del producto..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9 rounded-xl h-10 bg-gray-50 border-gray-100 focus:border-amber-300 focus-visible:ring-amber-200 text-sm transition-all"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-amber-500" /> Estado
          </label>
          <Select onValueChange={handleStateChange} value={selectedState || "all-states"}>
            <SelectTrigger className="rounded-xl h-10 bg-gray-50 border-gray-100 text-sm focus:border-amber-300">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all-states">Todos los estados</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Municipio */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Municipio</label>
          <Select
            onValueChange={handleMunicipalityChange}
            value={selectedMunicipality || "all-municipalities"}
            disabled={!selectedState}
          >
            <SelectTrigger className="rounded-xl h-10 bg-gray-50 border-gray-100 text-sm disabled:opacity-40 focus:border-amber-300">
              <SelectValue placeholder={selectedState ? "Selecciona municipio" : "Elige estado primero"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all-municipalities">Todos</SelectItem>
              {(municipalitiesByState[selectedState] || []).map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Categorías — collapsible */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCategories(v => !v)}
            className="flex items-center justify-between w-full group"
          >
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer">
              <Tag className="h-3 w-3 text-amber-500" /> Categorías
              {selectedCategories.length > 0 && (
                <span className="bg-amber-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {selectedCategories.length}
                </span>
              )}
            </label>
            {showCategories
              ? <ChevronUp className="h-3.5 w-3.5 text-gray-300" />
              : <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
            }
          </button>

          {showCategories && (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategories([])}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150",
                  selectedCategories.length === 0
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                )}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150",
                    selectedCategories.includes(cat)
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-700"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* On sale toggle */}
        <button
          onClick={() => setOnSaleOnly(v => !v)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150",
            onSaleOnly
              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
              : "bg-white text-gray-500 border-gray-100 hover:border-orange-200 hover:text-orange-600"
          )}
        >
          <Flame className={cn("h-4 w-4", onSaleOnly ? "text-white" : "text-orange-400")} />
          Solo en oferta
          {onSaleOnly && <span className="ml-auto text-[9px] font-bold text-white/70 uppercase tracking-widest">Activo</span>}
        </button>

        {/* Price range */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio máximo</label>
            <span className="text-sm font-black text-amber-700">${price.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-amber-500 cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f59e0b ${((price - minPrice) / (maxPrice - minPrice)) * 100}%, #e5e7eb ${((price - minPrice) / (maxPrice - minPrice)) * 100}%)`
            }}
          />
          <div className="flex justify-between text-[10px] text-gray-300 font-medium">
            <span>${minPrice.toLocaleString()}</span>
            <span>${maxPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Active filter badges */}
        {activeFilterBadges.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filtros activos:</p>
            <div className="flex flex-wrap gap-1.5">
              {activeFilterBadges.map((badge, i) => (
                <button
                  key={i}
                  onClick={badge.onRemove}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-100 transition-colors"
                >
                  {badge.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── PRODUCTOS ── */}
      <section>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-black text-gray-900">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "producto encontrado" : "productos encontrados"}
            {hasFilters && (
              <span className="text-amber-600 font-semibold ml-1.5">(filtrado)</span>
            )}
          </p>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={v => v && setView(v as "grid" | "list")}
            className="bg-gray-50 border border-gray-100 rounded-xl p-1 gap-0"
          >
            <ToggleGroupItem
              value="grid"
              className="rounded-lg h-8 w-8 data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              className="rounded-lg h-8 w-8 data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              <List className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {filteredProducts.length > 0 ? (
          view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <ProductListItem key={product.id} product={product} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-3xl gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Search className="h-7 w-7 text-gray-200" />
            </div>
            <div>
              <p className="font-semibold text-gray-500">No se encontraron productos</p>
              <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros</p>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-amber-600 hover:text-amber-700 underline transition-colors"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
