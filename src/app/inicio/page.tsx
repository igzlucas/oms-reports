import { initializeFirebaseServer } from '@/firebase/server';
import { InicioPageClient } from './inicio-client';

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  onSale?: boolean;
  salePrice?: number;
  saleLabel?: string;
}

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    const { firestore } = initializeFirebaseServer();
    const snapshot = await firestore.collection('products').where('stock', '>', 0).get();
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeaturedProduct));
    return all.sort(() => 0.5 - Math.random()).slice(0, 4);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function InicioPage() {
  const featuredProducts = await getFeaturedProducts();
  return <InicioPageClient featuredProducts={featuredProducts} />;
}