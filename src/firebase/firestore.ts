
import { Product, Store } from "@/lib/types";
import { initializeFirebaseServer } from "@/firebase/server";

export async function getProductsAndStores() {
    try {
        const { firestore } = initializeFirebaseServer();
        const storesSnapshot = await firestore.collection('stores').get();
        const stores: Store[] = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
        const storeMap = new Map(stores.map(store => [store.id, store]));

        const productSnapshot = await firestore.collection('products').get();
        const products: Product[] = productSnapshot.docs.map(doc => {
            const productData = doc.data() as Omit<Product, 'id'>;
            return {
                id: doc.id,
                ...productData,
                store: storeMap.get(productData.storeId),
            } as Product;
        }).filter(p => p.stock > 0);

        const categories = [...new Set(products.map(p => p.category))];

        return { products, categories, stores };
    } catch (error) {
        console.error("Error fetching products for catalog:", error);
        return { products: [], categories: [], stores: [] };
    }
}
