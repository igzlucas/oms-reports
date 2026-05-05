
import { getProductsAndStores } from "@/firebase/firestore";
import { CatalogPageClient } from "./components/catalog-page-client";


export default async function CatalogPage() {
    const { products, categories, stores } = await getProductsAndStores();

    const states = [...new Set(stores.map(s => s.state))];
    const municipalitiesByState: Record<string, string[]> = {};
    states.forEach(state => {
      municipalitiesByState[state] = [...new Set(stores.filter(s => s.state === state).map(s => s.municipality))];
    });

    return (
        <CatalogPageClient 
            initialProducts={products} 
            categories={categories} 
            states={states}
            municipalitiesByState={municipalitiesByState}
        />
    );
}


