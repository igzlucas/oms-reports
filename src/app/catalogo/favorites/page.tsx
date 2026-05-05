'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, documentId, doc } from 'firebase/firestore';
import { Heart, AlertTriangle } from 'lucide-react';

import { useUser, useDoc, useCollection, useFirebase } from '@/firebase';
import { Product, UserProfile } from '@/lib/types';
import { ProductCard } from '../components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function FavoritesPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
  const favoriteIds = useMemo(() => userProfile?.favorites || [], [userProfile]);

  const favoritesQuery = useMemo(() => {
    if (!firestore || favoriteIds.length === 0) return null;
    return query(collection(firestore, 'products'), where(documentId(), 'in', favoriteIds));
  }, [firestore, favoriteIds]);

  const { data: favoriteProducts, isLoading: isLoadingProducts } = useCollection<Product>(favoritesQuery);
  const isLoading = isUserLoading || isLoadingProfile || (favoriteIds.length > 0 && isLoadingProducts);

  // Separar en stock y sin stock
  const inStockProducts = useMemo(() => favoriteProducts?.filter(p => p.stock > 0) || [], [favoriteProducts]);
  const outOfStockProducts = useMemo(() => favoriteProducts?.filter(p => p.stock === 0) || [], [favoriteProducts]);

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="container mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Mis Productos Favoritos</h1>
            {!isLoading && favoriteProducts && (
              <p className="text-sm text-gray-500">
                {favoriteProducts.length} producto{favoriteProducts.length !== 1 ? 's' : ''} guardado{favoriteProducts.length !== 1 ? 's' : ''}
                {outOfStockProducts.length > 0 && (
                  <span className="text-red-500 ml-2 font-medium">· {outOfStockProducts.length} sin stock</span>
                )}
              </p>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-3xl" />)}
          </div>
        )}

        {!isLoading && !user && (
          <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
            <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg mb-2">Inicia sesión para ver tus favoritos</p>
            <Link href="/login" className="text-sm text-amber-700 font-semibold hover:underline">Iniciar sesión →</Link>
          </div>
        )}

        {!isLoading && user && (!favoriteProducts || favoriteProducts.length === 0) && (
          <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
            <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg mb-1">Sin productos favoritos aún</p>
            <p className="text-gray-400 text-sm mb-6">Explora el catálogo y guarda los que más te gusten.</p>
            <Link href="/catalogo" className="text-sm text-amber-700 font-semibold hover:underline">Explorar catálogo →</Link>
          </div>
        )}

        {/* Productos con stock */}
        {!isLoading && inStockProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inStockProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}

        {/* Productos sin stock */}
        {!isLoading && outOfStockProducts.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Sin stock actualmente</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {outOfStockProducts.map(product => (
                <div key={product.id} className="relative">
                  {/* Overlay de agotado sobre la card */}
                  <div className="opacity-50 pointer-events-none">
                    <ProductCard product={product} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Badge className="bg-red-600 text-white border-0 font-black text-sm px-4 py-2 shadow-xl">
                      <AlertTriangle className="h-4 w-4 mr-1.5" /> Agotado
                    </Badge>
                  </div>
                  {/* Mantener el link activo para ver el producto */}
                  <Link href={`/catalogo/${product.id}`} className="absolute inset-0" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Estos productos están en tus favoritos pero sin stock. Te avisaremos cuando estén disponibles.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}