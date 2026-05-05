"use client";

import { useMemo, useState } from "react";
import { MapPin, Search, X, SlidersHorizontal, Store as StoreIcon } from "lucide-react";
import { Store } from "@/lib/types";
import { StoreCard } from "./store-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  stores: Store[];
  states: string[];
  municipalitiesByState: Record<string, string[]>;
}

export function StoresFilters({ stores, states, municipalitiesByState }: Props) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [search, setSearch] = useState("");

  const hasFilters = selectedState || selectedMunicipality || search;

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      if (selectedState && store.state !== selectedState) return false;
      if (selectedMunicipality && store.municipality !== selectedMunicipality) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = store.name?.toLowerCase().includes(q);
        const matchDesc = store.description?.toLowerCase().includes(q);
        const matchMuni = store.municipality?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchMuni) return false;
      }
      return true;
    });
  }, [stores, selectedState, selectedMunicipality, search]);

  const clearFilters = () => {
    setSelectedState("");
    setSelectedMunicipality("");
    setSearch("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

      {/* SIDEBAR FILTROS */}
      <aside className="lg:sticky lg:top-24 bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-amber-700" />
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

        {/* Búsqueda */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Buscar tienda</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <Input
              placeholder="Nombre, descripción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-11 bg-gray-50 border-gray-100 focus-visible:ring-amber-500 text-sm"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-600" /> Estado
          </label>
          <Select
            onValueChange={value => {
              setSelectedState(value === "all" ? "" : value);
              setSelectedMunicipality("");
            }}
            value={selectedState || "all"}
          >
            <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-gray-100 text-sm">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos los estados</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Municipio */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Municipio</label>
          <Select
            disabled={!selectedState}
            onValueChange={value => setSelectedMunicipality(value === "all" ? "" : value)}
            value={selectedMunicipality || "all"}
          >
            <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-gray-100 text-sm disabled:opacity-40">
              <SelectValue placeholder={selectedState ? "Selecciona municipio" : "Primero elige estado"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos</SelectItem>
              {(municipalitiesByState[selectedState] || []).map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumen filtros activos */}
        {hasFilters && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-400 font-medium">Filtros activos:</p>
            <div className="flex flex-wrap gap-1.5">
              {search && (
                <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-100">
                  "{search}"
                </Badge>
              )}
              {selectedState && (
                <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-100">
                  {selectedState}
                </Badge>
              )}
              {selectedMunicipality && (
                <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-100">
                  {selectedMunicipality}
                </Badge>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* GRID DE TIENDAS */}
      <section>
        {/* Header resultado */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900 text-base">{filteredStores.length}</span>
            {" "}tienda{filteredStores.length !== 1 ? 's' : ''} encontrada{filteredStores.length !== 1 ? 's' : ''}
            {hasFilters && <span className="text-amber-700 ml-1">(filtrado)</span>}
          </p>
        </div>

        {filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStores.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
            <StoreIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg mb-1">Sin resultados</p>
            <p className="text-gray-400 text-sm mb-6">No encontramos tiendas con esos filtros.</p>
            <Button variant="outline" className="rounded-xl" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}