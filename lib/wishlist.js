'use client';
import { create } from 'zustand';
const KEY = 'onet_wishlist';
const read = () => { if (typeof window === 'undefined') return []; try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };

export const useWishlist = create((set, get) => ({
  ids: [],
  hydrate: () => set({ ids: read().map((p) => p.id) }),
  items: () => read(),
  has: (id) => get().ids.includes(id),
  toggle: (p) => {
    const cur = read();
    const exists = cur.find((x) => x.id === p.id);
    const next = exists ? cur.filter((x) => x.id !== p.id) : [{ id: p.id, name: p.name, price: p.price, mrp: p.mrp, image: p.image }, ...cur];
    write(next); set({ ids: next.map((x) => x.id) });
    return !exists;
  },
  remove: (id) => { const next = read().filter((x) => x.id !== id); write(next); set({ ids: next.map((x) => x.id) }); },
}));