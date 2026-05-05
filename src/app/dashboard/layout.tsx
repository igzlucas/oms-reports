"use client"

import type { ReactNode } from "react";
import { useEffect, useMemo, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { doc, collection, query, where } from "firebase/firestore";

import { Header } from "@/components/dashboard/header";
import { useUser, useFirebase, useDoc, useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import type { Store, UserProfile } from "@/lib/types";
import { DashboardMobileNav } from "./components/dashboard-mobile-nav";
import { useToast } from "@/hooks/use-toast";

// Context to share store data
interface DashboardContextType {
    stores: Store[] | null;
    isLoadingStores: boolean;
    activeStore: Store | null;
}
const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardLayout");
    }
    return context;
}

function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex items-center justify-between h-16 px-4 md:px-6 border-b">
                <Skeleton className="h-8 w-32" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-20 hidden md:block" />
                  <Skeleton className="h-8 w-20 hidden md:block" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
    )
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userProfileRef);

  const storesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "stores"), where("ownerId", "==", user.uid));
  }, [user, firestore]);

  const { data: stores, isLoading: isLoadingStoresCollection } = useCollection<Store>(storesQuery);

  const activeStore = useMemo(() => {
    if (!userProfile?.storeId || !stores) return null;
    return stores.find(s => s.id === userProfile.storeId) || null;
  }, [userProfile, stores]);

  const isLoading = isUserLoading || isLoadingUserProfile || isLoadingStoresCollection;


  useEffect(() => {
    // First, handle unauthenticated users
    if (!isUserLoading && !user) {
      router.push("/login");
      return; // Stop execution
    }

    // After auth and profile are loaded, check role
    if (!isLoadingUserProfile && userProfile) {
        if (userProfile.role !== 'seller') {
            router.push('/catalogo'); // Redirect non-sellers
        }
    }
  }, [user, isUserLoading, userProfile, isLoadingUserProfile, router]);

  if (isLoading || !user || !userProfile || userProfile.role !== 'seller') {
    return <DashboardSkeleton />;
  }

  const contextValue = { stores, isLoadingStores: isLoading, activeStore };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
        <DashboardMobileNav />
      </div>
    </DashboardContext.Provider>
  );
}
