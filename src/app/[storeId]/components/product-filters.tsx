"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface Props {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (c: string | null) => void;
  priceRange: [number, number];
  maxPrice: number;
  onPriceChange: (v: [number, number]) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

export function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  maxPrice,
  onPriceChange,
  search,
  onSearchChange,
}: Props) {
  return (
    <aside className="space-y-6">
      {/* SEARCH */}
      <div>
        <p className="font-semibold mb-2">Buscar</p>
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* CATEGORY */}
      <div>
        <p className="font-semibold mb-2">Categorías</p>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={!selectedCategory ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryChange(null)}
          >
            Todas
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onCategoryChange(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* PRICE */}
      <div>
        <p className="font-semibold mb-2">
          Precio: ${priceRange[0]} – ${priceRange[1]}
        </p>
        <Slider
          value={priceRange}
          min={0}
          max={maxPrice}
          step={1}
          onValueChange={(v) => onPriceChange(v as [number, number])}
        />
      </div>
    </aside>
  );
}
