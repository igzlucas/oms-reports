'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, doc, documentId } from 'firebase/firestore';
import { Store as StoreIcon, Phone, MessageSquare, Facebook, Instagram, Twitter, MapPin } from 'lucide-react';

import { useUser, useDoc, useCollection, useFirebase } from '@/firebase';
import { Store, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FavoriteButton } from '../components/favorite-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function StoreCard({ store }: { store: Store }) {
    const imageSrc = store.bannerUrl || `https://picsum.photos/seed/${store.id}/400/200`;

    return (
        <Card className="flex flex-col h-full overflow-hidden transition-shadow hover:shadow-lg border group">
            <div className="relative h-40 w-full bg-muted">
                <Link href={`/${store.slug}`}>
                    <Image
                        src={imageSrc}
                        alt={store.name}
                        fill
                        className="object-cover"
                        data-ai-hint={store.bannerHint || 'store banner'}
                    />
                </Link>
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FavoriteButton itemId={store.id} itemType="store" />
                </div>
            </div>
            <CardHeader>
                <CardTitle>
                     <Link href={`/${store.slug}`} className="group-hover:text-primary transition-colors">{store.name}</Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10">{store.description}</CardDescription>
            </CardHeader>
             <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{store.municipality}, {store.state}</span>
                </div>
                {store.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" /> 
                        <span>{store.phone}</span>
                    </div>
                )}
                 {store.whatsapp && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span>{store.whatsapp}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-4">
                 <div className="flex items-center justify-center gap-4 text-muted-foreground">
                    {store.socials?.facebook && (
                        <a href={store.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
                    )}
                    {store.socials?.instagram && (
                        <a href={store.socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                    )}
                    {store.socials?.x && (
                        <a href={store.socials.x} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                    )}
                </div>
                <Button asChild className="w-full">
                    <Link href={`/${store.slug}`}>Ver productos</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function FavoriteStoresPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const userProfileRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const favoriteStoreIds = useMemo(() => userProfile?.favoriteStores || [], [userProfile]);

    const favoritesQuery = useMemo(() => {
        if (!firestore || favoriteStoreIds.length === 0) return null;
        return query(collection(firestore, 'stores'), where(documentId(), 'in', favoriteStoreIds));
    }, [firestore, favoriteStoreIds]);

    const { data: favoriteStores, isLoading: isLoadingStores } = useCollection<Store>(favoritesQuery);

    const isLoading = isUserLoading || isLoadingProfile || (favoriteStoreIds.length > 0 && isLoadingStores);

    if (isLoading) {
        return (
             <div className="container py-12">
                 <div className="flex items-center gap-4 mb-8">
                    <StoreIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Mis Tiendas Favoritas</h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container py-12">
                 <div className="flex items-center gap-4 mb-8">
                    <StoreIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Mis Tiendas Favoritas</h1>
                </div>
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Debes <Link href="/login" className="underline font-semibold">iniciar sesión</Link> para ver tus tiendas favoritas.</p>
                </div>
            </div>
        );
    }

    if (!favoriteStores || favoriteStores.length === 0) {
        return (
            <div className="container py-12">
                <div className="flex items-center gap-4 mb-8">
                    <StoreIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Mis Tiendas Favoritas</h1>
                </div>
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Aún no has guardado ninguna tienda como favorita.</p>
                    <p className="text-muted-foreground mt-2">Cuando encuentres una tienda que te guste, haz clic en el corazón para guardarla.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container py-12">
            <div className="flex items-center gap-4 mb-8">
                <StoreIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Mis Tiendas Favoritas</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteStores.map(store => (
                    <StoreCard key={store.id} store={store} />
                ))}
            </div>
        </div>
    );
}
