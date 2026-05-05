'use client';

import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { useUser, useFirebase, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  itemId: string;
  itemType: 'product' | 'store';
  className?: string;
}

export function FavoriteButton({ itemId, itemType, className }: FavoriteButtonProps) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const userProfileRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isFavorite = useMemo(() => {
    if (itemType === 'product') {
      return userProfile?.favorites?.includes(itemId) ?? false;
    }
    return userProfile?.favoriteStores?.includes(itemId) ?? false;
  }, [userProfile, itemId, itemType]);

  const toggleFavorite = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!user || !userProfileRef) {
      toast({
        variant: 'destructive',
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para usar tus favoritos.',
      });
      router.push('/login');
      return;
    }

    const field = itemType === 'product' ? 'favorites' : 'favoriteStores';
    const itemTypeName = itemType === 'product' ? 'producto' : 'tienda';

    try {
      if (isFavorite) {
        await updateDoc(userProfileRef, {
          [field]: arrayRemove(itemId),
        });
        toast({
          title: `Eliminado de favoritos`,
          description: `El ${itemTypeName} fue eliminado de tu lista.`,
        });
      } else {
        await updateDoc(userProfileRef, {
          [field]: arrayUnion(itemId),
        });
        toast({
          title: `¡Añadido a favoritos!`,
          description: `El ${itemTypeName} fue añadido a tu lista.`,
        });
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar tus favoritos.',
      });
    }
  };
  
  if (!user) {
      return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      className={cn("text-white hover:text-red-500 rounded-full bg-black/20 hover:bg-black/40", className)}
      aria-label={`Añadir ${itemType === 'product' ? 'producto' : 'tienda'} a favoritos`}
    >
      <Heart className={cn('h-5 w-5', isFavorite && 'fill-red-500 text-red-500')} />
    </Button>
  );
}
