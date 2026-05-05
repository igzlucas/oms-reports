'use client';

import Link from "next/link";
import Image from "next/image";
import { Phone, MessageSquare, Facebook, Instagram, Twitter, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Store } from "@/lib/types";
import { FavoriteButton } from "../../catalogo/components/favorite-button";
import { useUser } from "@/firebase";

interface Props {
  store: Store;
}

export function StoreCard({ store }: Props) {
  const { user } = useUser();
  const imageSrc = store.bannerUrl
    ? store.bannerUrl
    : `https://picsum.photos/seed/${store.id}/800/400`;

  const hasSocials = store.socials?.facebook || store.socials?.instagram || store.socials?.x;

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100/80 flex flex-col">
      
      {/* IMAGEN */}
      <div className="relative h-48 w-full overflow-hidden bg-amber-50">
        <Link href={`/${store.slug}`}>
          <Image
            src={imageSrc}
            alt={store.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            data-ai-hint={store.bannerHint || 'store banner'}
          />
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* Badge verificada */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-amber-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 flex items-center gap-1 shadow-md">
            <ShieldCheck className="h-3 w-3" />
            Verificada
          </Badge>
        </div>

        {/* Favorito — solo logueados (FavoriteButton retorna null si no hay user) */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <FavoriteButton itemId={store.id} itemType="store" />
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex flex-col flex-1 p-5">
        
        {/* Nombre */}
        <Link href={`/${store.slug}`}>
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-amber-700 transition-colors line-clamp-1">
            {store.name}
          </h3>
        </Link>

        {/* Descripción */}
        {store.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {store.description}
          </p>
        )}

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-medium text-gray-600">{store.municipality}, {store.state}</span>
          </div>
          {store.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{store.phone}</span>
            </div>
          )}
          {store.whatsapp && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MessageSquare className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{store.whatsapp}</span>
            </div>
          )}
        </div>

        {/* Redes sociales */}
        {hasSocials && (
          <div className="flex items-center gap-3 mb-4">
            {store.socials?.facebook && (
              <a href={store.socials.facebook} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-amber-100 flex items-center justify-center text-gray-400 hover:text-amber-700 transition-colors">
                <Facebook className="h-3.5 w-3.5" />
              </a>
            )}
            {store.socials?.instagram && (
              <a href={store.socials.instagram} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-amber-100 flex items-center justify-center text-gray-400 hover:text-amber-700 transition-colors">
                <Instagram className="h-3.5 w-3.5" />
              </a>
            )}
            {store.socials?.x && (
              <a href={store.socials.x} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-amber-100 flex items-center justify-center text-gray-400 hover:text-amber-700 transition-colors">
                <Twitter className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Link
            href={`/${store.slug}`}
            className="flex items-center justify-center gap-2 w-full bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-semibold text-sm py-3 px-4 rounded-2xl transition-all duration-200 group/btn"
          >
            <span>Ver productos</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}