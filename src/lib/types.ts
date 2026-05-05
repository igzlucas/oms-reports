export type Store = {
    id: string;
    name: string;
    slug: string;
    description: string;
    ownerId: string;
    isActive: boolean;
    phone?: string;
    whatsapp?: string;
    socials?: {
        facebook?: string;
        instagram?: string;
        x?: string;
    },
    state: string;
    municipality: string;
    bannerUrl?: string;
    bannerHint?: string;
}

export type Product = {
  id: string;
  storeId: string;
  ownerId: string;
  name: string;
  description: string;
  costPrice: number;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  sizes?: string[];
  colors?: string[];
  store?: Store;
  // Campos de oferta
  onSale?: boolean;
  salePrice?: number;
  saleLabel?: string; // Ej: "2x1", "Liquidación", "Oferta"
};

export type SalesTicketItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type SalesTicket = {
  id: string;
  storeId: string;
  ownerId: string;
  ticketNumber: string;
  totalSales: number;
  date: string;
  items: SalesTicketItem[];
  status?: 'pending' | 'completed' | 'cancelled';
};

export type DailySales = {
  date: string;
  sales: number;
};

export type UserProfile = {
    id: string;
    email: string;
    displayName: string;
    role: 'buyer' | 'seller';
    favorites?: string[];
    favoriteStores?: string[];
    storeId?: string;
}

export type Rating = {
    id: string;
    storeId: string;
    userId: string;
    userName?: string;
    userRole?: 'buyer' | 'seller';
    rating: number;
    comment?: string;
    date: string;
    ownerReply?: string;
    replyDate?: string;
}