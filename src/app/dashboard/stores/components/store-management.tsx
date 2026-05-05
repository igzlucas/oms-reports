
"use client"

import { useState } from "react";
import { PlusCircle, Store as StoreIcon, Phone, MessageSquare, Facebook, Instagram, Twitter, Eye, MoreVertical } from "lucide-react";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";

import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStoreModal } from "./add-store-modal";
import { EditStoreModal } from "./edit-store-modal";
import { useDashboard } from "../../layout";
import { useToast } from "@/hooks/use-toast";
import type { Store } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export function StoreManagement() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const { stores, isLoadingStores, activeStore } = useDashboard();

    const handleSetActiveStore = (storeId: string) => {
        if (!user || !firestore) return;

        const userDocRef = doc(firestore, `users`, user.uid);
        setDoc(userDocRef, { storeId: storeId }, { merge: true }).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { storeId },
            }));
        });

        toast({
            title: "Tienda Activa Cambiada",
            description: "Has seleccionado una nueva tienda activa.",
        });
    };

    const handleEditClick = (store: Store) => {
        setSelectedStore(store);
        setIsEditModalOpen(true);
    };

    return (
        <>
            <AddStoreModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            {selectedStore && <EditStoreModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} store={selectedStore} />}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gestiona tus Tiendas</CardTitle>
                            <CardDescription>Selecciona tu tienda activa o crea una nueva.</CardDescription>
                        </div>
                         <Button size="sm" className="gap-1" onClick={() => setIsAddModalOpen(true)}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Crear Tienda
                            </span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingStores && <p>Cargando tiendas...</p>}
                    {!isLoadingStores && (!stores || stores.length === 0) && (
                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <StoreIcon className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No se Encontraron Tiendas</h3>
                            <p className="text-muted-foreground mb-4">Empieza por crear tu primera tienda.</p>
                            <Button onClick={() => setIsAddModalOpen(true)}>Crear una Nueva Tienda</Button>
                        </div>
                    )}
                    {!isLoadingStores && stores && stores.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {stores.map(store => (
                                <Card key={store.id} className={activeStore?.id === store.id ? "border-primary" : ""}>
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <div>
                                            <CardTitle>{store.name}</CardTitle>
                                            <CardDescription>{store.description}</CardDescription>
                                        </div>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(store)}>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                     <Link href={`/${store.slug}`} target="_blank">Ver Tienda</Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-sm text-muted-foreground">{store.municipality}, {store.state}</p>
                                        {store.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /> <span>{store.phone}</span></div>}
                                        {store.whatsapp && <div className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4" /> <span>{store.whatsapp}</span></div>}
                                        
                                        <div className="flex items-center gap-4 text-sm pt-2">
                                            {store.socials?.facebook && <Link href={store.socials.facebook} target="_blank"><Facebook className="h-5 w-5" /></Link>}
                                            {store.socials?.instagram && <Link href={store.socials.instagram} target="_blank"><Instagram className="h-5 w-5" /></Link>}
                                            {store.socials?.x && <Link href={store.socials.x} target="_blank"><Twitter className="h-5 w-5" /></Link>}
                                        </div>

                                    </CardContent>
                                    <CardFooter>
                                         <Button
                                            className="w-full"
                                            onClick={() => handleSetActiveStore(store.id)}
                                            disabled={activeStore?.id === store.id}
                                        >
                                            {activeStore?.id === store.id ? "Tienda Activa" : "Establecer como Activa"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
