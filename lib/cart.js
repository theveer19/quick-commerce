'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      add: (product, size, color) =>
        set((s) => {
          const key = `${product.id}__${size || 'default'}__${color || 'default'}`;
          const existing = s.items.find((i) => i.key === key);
          if (existing) {
            return { items: s.items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)) };
          }
          return {
            items: [
              ...s.items,
              { key, id: product.id, name: product.name, price: product.price, image: product.image, size: size || null, color: color || null, qty: 1 },
            ],
          };
        }),
      inc: (key) => set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)) })),
      dec: (key) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.key === key ? { ...i, qty: i.qty - 1 } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((a, i) => a + i.qty, 0),
      subtotal: () => get().items.reduce((a, i) => a + i.qty * i.price, 0),
    }),
    { name: 'onet_cart', storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined)) }
  )
);
