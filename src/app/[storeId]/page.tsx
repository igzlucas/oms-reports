import { notFound } from "next/navigation";
import { initializeFirebaseServer } from "@/firebase/server";
import { Store, Product } from "@/lib/types";
import { StorePageClient } from "./components/store-page-client";
import type { Metadata } from 'next';

interface StorePageProps {
  params: Promise<{ storeId: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { storeId } = await params;
  const { firestore } = initializeFirebaseServer();

  const storeQuery = firestore.collection('stores').where("slug", "==", storeId).limit(1);
  const storeSnapshot = await storeQuery.get();

  if (storeSnapshot.empty) {
    return { title: "Tienda no encontrada | MiBazar", description: "La tienda que buscas no existe o fue eliminada." };
  }

  const store = storeSnapshot.docs[0].data() as Store;
  const description = store.description
    ? `Explora los productos de ${store.name} en MiBazar. ${store.description.substring(0, 120)}...`
    : `Descubre la tienda ${store.name} y sus productos en MiBazar.`;

  return {
    title: `Tienda ${store.name} | MiBazar`,
    description,
    openGraph: {
      title: `Tienda ${store.name} | MiBazar`,
      description,
      images: [{ url: store.bannerUrl || '/image/logo.png', width: 800, height: 800, alt: `Logo de ${store.name}` }],
      locale: 'es_MX',
      type: 'website',
    },
  };
}

async function getStoreAndProducts(slug: string): Promise<{ store: Store | null; products: Product[] }> {
  const { firestore } = initializeFirebaseServer();
  try {
    const storeSnapshot = await firestore.collection('stores').where("slug", "==", slug).get();
    if (storeSnapshot.empty) return { store: null, products: [] };

    const storeDoc = storeSnapshot.docs[0];
    const store = { id: storeDoc.id, ...storeDoc.data() } as Store;

    const productsSnapshot = await firestore.collection('products').where("storeId", "==", store.id).get();
    const products = productsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Product))
      .filter(p => p.stock > 0);

    return { store, products };
  } catch (error) {
    console.error("Error fetching store and products:", error);
    return { store: null, products: [] };
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { storeId } = await params;
  const { store, products } = await getStoreAndProducts(storeId);
  if (!store) return notFound();
  return <StorePageClient store={store} initialProducts={products} />;
}