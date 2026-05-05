"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Firestore, collection, onSnapshot, query, where, documentId } from 'firebase/firestore';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from "@/components/ui/toast";

interface CartItem extends Product {
  quantity: number;
  cartItemId: string;
  selectedSize: string | null;
  selectedColor: string | null;
}

interface CartContextType {
  items: CartItem[];
  outOfStockItems: string[]; // cartItemIds sin stock actual
  addItem: (product: Product, selectedSize: string | null, selectedColor: string | null) => void;
  removeItem: (cartItemId: string) => void;
  updateItemQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  clearOutOfStockItems: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
  firestore?: Firestore;
}

export const CartProvider = ({ children, firestore }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);
  const { toast } = useToast();
  // Ref para evitar el loop en el effect de sincronización
  const cartItemIdsRef = useRef<string>('');

  // ── Cargar desde localStorage ──
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('powergirl-cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart) && (parsedCart.length === 0 || parsedCart[0].cartItemId)) {
          setCartItems(parsedCart);
        } else {
          localStorage.removeItem('powergirl-cart');
        }
      }
    } catch {
      localStorage.removeItem('powergirl-cart');
    }
  }, []);

  // ── Guardar en localStorage ──
  useEffect(() => {
    localStorage.setItem('powergirl-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // ── Sincronización en tiempo real del stock desde Firestore ──
  useEffect(() => {
    if (!firestore || cartItems.length === 0) {
      setOutOfStockItems([]);
      return;
    }

    const productIds = [...new Set(cartItems.map(item => item.id))];
    const newIdsKey = productIds.sort().join(',');

    // Solo re-subscribir si cambiaron los IDs de productos
    if (cartItemIdsRef.current === newIdsKey) return;
    cartItemIdsRef.current = newIdsKey;

    const unsubscribes: (() => void)[] = [];

    // Firestore 'in' permite máx 30 items
    for (let i = 0; i < productIds.length; i += 30) {
      const chunk = productIds.slice(i, i + 30);
      const q = query(collection(firestore, 'products'), where(documentId(), 'in', chunk));

      const unsub = onSnapshot(q, (snapshot) => {
        const stockMap: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          stockMap[doc.id] = doc.data().stock ?? 0;
        });

        // Actualizar stock en los items del carrito
        setCartItems(prev =>
          prev.map(item => ({
            ...item,
            stock: stockMap[item.id] !== undefined ? stockMap[item.id] : item.stock,
          }))
        );

        // Actualizar lista de items sin stock
        setOutOfStockItems(prev => {
          const newSet = new Set(prev);
          cartItems.forEach(item => {
            if (stockMap[item.id] !== undefined) {
              if (stockMap[item.id] === 0) {
                newSet.add(item.cartItemId);
              } else {
                newSet.delete(item.cartItemId);
              }
            }
          });
          return [...newSet];
        });
      });

      unsubscribes.push(unsub);
    }

    return () => {
      unsubscribes.forEach(u => u());
      cartItemIdsRef.current = '';
    };
  }, [firestore, cartItems.length]); // re-subscribir si se añaden/quitan productos

  const addItem = (product: Product, selectedSize: string | null, selectedColor: string | null) => {
    if (product.stock === 0) {
      toast({ variant: "destructive", title: "Sin stock", description: `${product.name} no tiene stock disponible.` });
      return;
    }

    if (cartItems.length > 0 && cartItems[0].storeId !== product.storeId) {
      toast({
        variant: "destructive",
        title: "No puedes mezclar productos",
        description: "Tu carrito contiene productos de otra tienda. ¿Deseas vaciarlo?",
        action: <ToastAction altText="Vaciar Carrito" onClick={clearCart}>Vaciar Carrito</ToastAction>,
      });
      return;
    }

    const cartItemId = `${product.id}-${selectedSize || 'nosize'}-${selectedColor || 'nocolor'}`;
    const existingItem = cartItems.find(item => item.cartItemId === cartItemId);

    if (existingItem && existingItem.quantity >= product.stock) {
      toast({ variant: "destructive", title: "Stock Insuficiente", description: `Solo quedan ${product.stock} unidades de ${product.name}.` });
      return;
    }

    setCartItems(prevItems => {
      const existing = prevItems.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prevItems.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1, cartItemId, selectedSize, selectedColor }];
    });
  };

  const removeItem = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    setOutOfStockItems(prev => prev.filter(id => id !== cartItemId));
  };

  const updateItemQuantity = (cartItemId: string, quantity: number) => {
    const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);
    if (!itemToUpdate) return;

    if (quantity > itemToUpdate.stock) {
      toast({ variant: "destructive", title: "Stock Insuficiente", description: `Solo quedan ${itemToUpdate.stock} unidades de ${itemToUpdate.name}.` });
      setCartItems(prev => prev.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: itemToUpdate.stock } : item
      ));
      return;
    }

    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
      setOutOfStockItems(prev => prev.filter(id => id !== cartItemId));
    } else {
      setCartItems(prev => prev.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setOutOfStockItems([]);
  };

  const clearOutOfStockItems = () => {
    setCartItems(prev => prev.filter(item => !outOfStockItems.includes(item.cartItemId)));
    setOutOfStockItems([]);
    toast({ title: "Carrito actualizado", description: "Se eliminaron los productos sin stock." });
  };

  return (
    <CartContext.Provider value={{ items: cartItems, outOfStockItems, addItem, removeItem, updateItemQuantity, clearCart, clearOutOfStockItems }}>
      {children}
    </CartContext.Provider>
  );
};