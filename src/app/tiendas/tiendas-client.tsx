'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { Store } from "@/lib/types";
import { StoresFilters } from "./components/stores-filters";
import { Store as StoreIcon } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TiendasClient() {
  const { firestore } = useFirebase();
  const [stores, setStores] = useState<Store[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [municipalitiesByState, setMunicipalitiesByState] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      if (!firestore) return;
      try {
        const snapshot = await getDocs(collection(firestore, "stores"));
        const fetchedStores: Store[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
        const shuffled = shuffleArray(fetchedStores.filter(s => s.isActive !== false));
        setStores(shuffled);

        const uniqueStates = [...new Set(shuffled.map(s => s.state).filter(Boolean))];
        setStates(uniqueStates);

        const munisByState: Record<string, string[]> = {};
        uniqueStates.forEach(state => {
          munisByState[state] = [
            ...new Set(shuffled.filter(s => s.state === state).map(s => s.municipality).filter(Boolean))
          ];
        });
        setMunicipalitiesByState(munisByState);
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [firestore]);

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-32">
            <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-700 animate-spin mx-auto" />
            <p className="mt-4 text-gray-400 text-sm">Cargando tiendas...</p>
          </div>
        ) : (
          <StoresFilters
            stores={stores}
            states={states}
            municipalitiesByState={municipalitiesByState}
          />
        )}
      </div>
    </div>
  );
}