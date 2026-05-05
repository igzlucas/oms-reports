import { notFound } from "next/navigation";
import { initializeFirebaseServer } from "@/firebase/server";
import { Product, Store } from "@/lib/types";
import { ProductDetailClient } from "./components/product-detail-client";
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const { firestore } = initializeFirebaseServer();

  const productSnap = await firestore.collection('products').doc(productId).get();
  if (!productSnap.exists) {
    return { title: "Producto no encontrado | MiBazar", description: "El producto que buscas no existe o fue eliminado." };
  }

  const product = productSnap.data() as Product;
  const description = product.description
    ? `Encuentra ${product.name} a solo $${product.price.toFixed(2)}. ${product.description.substring(0, 100)}...`
    : `Encuentra ${product.name} en MiBazar a un precio increíble.`;

  return {
    title: `${product.name} | MiBazar`,
    description,
    openGraph: {
      title: `${product.name} | MiBazar`,
      description,
      images: [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }],
      locale: 'es_MX',
      type: 'website',
    },
  };
}

async function getProductAndStore(productId: string) {
  const { firestore } = initializeFirebaseServer();
  try {
    const productSnap = await firestore.collection('products').doc(productId).get();
    if (!productSnap.exists) return { product: null, store: null, suggestedProducts: [] };

    const product = { id: productSnap.id, ...productSnap.data() } as Product;
    const storeSnap = await firestore.collection('stores').doc(product.storeId).get();
    const store = storeSnap.exists ? { id: storeSnap.id, ...storeSnap.data() } as Store : null;

    let suggestedProducts: Product[] = [];
    if (store) {
      const productsSnapshot = await firestore.collection('products').where("storeId", "==", store.id).limit(5).get();
      suggestedProducts = productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.id !== productId && p.stock > 0)
        .slice(0, 4);
    }

    return { product, store, suggestedProducts };
  } catch (error) {
    console.error("Error fetching product and store:", error);
    return { product: null, store: null, suggestedProducts: [] };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const { product, store, suggestedProducts } = await getProductAndStore(productId);
  if (!product) notFound();
  return <ProductDetailClient product={product} store={store} suggestedProducts={suggestedProducts} />;
}