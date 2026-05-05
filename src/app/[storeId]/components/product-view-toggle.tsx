"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";

interface Props {
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  sort: string;
  onSortChange: (v: string) => void;
}

export function ProductViewToggle({ view, onViewChange, sort, onSortChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Nombre A–Z</SelectItem>
          <SelectItem value="price-asc">Precio ↑</SelectItem>
          <SelectItem value="price-desc">Precio ↓</SelectItem>
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && onViewChange(v as any)}
      >
        <ToggleGroupItem value="grid">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
