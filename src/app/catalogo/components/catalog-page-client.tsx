"use client";

import { useEffect, useState } from "react";
import { Product } from "@/lib/types";
import { ProductFilters } from "./product-filters";

interface Props {
  initialProducts: Product[];
  categories: string[];
  states: string[];
  municipalitiesByState: Record<string, string[]>;
}

export function CatalogPageClient({
  initialProducts,
  categories,
  states,
  municipalitiesByState,
}: Props) {
  const [banner, setBanner] = useState<string>("");

//   useEffect(() => {
//     const seed = new Date().toISOString().slice(0, 10);
//     setBanner(`https://picsum.photos/1400/360?seed=${seed}`);
//   }, []);

  return (
    <div className="min-h-screen">
      {/* BANNER */}
      {/* <div
        className="h-64 md:h-80 w-full bg-cover bg-center rounded-b-3xl"
        style={{ backgroundImage: `url(${banner})` }}
      >
        <div className="h-full w-full bg-black/40 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Explora Nuestro Catálogo
          </h1>
          <p className="mt-4 max-w-2xl text-lg">
            Encuentra los mejores productos de nuestras tiendas
          </p>
        </div>
      </div> */}

      {/* CONTENIDO */}
      <div className="container mx-auto px-4 py-10">
        <ProductFilters
          initialProducts={initialProducts}
          categories={categories}
          states={states}
          municipalitiesByState={municipalitiesByState}
        />
      </div>
    </div>
  );
}
