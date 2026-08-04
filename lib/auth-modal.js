'use client';
import { create } from 'zustand';

// Global controller so the login popup can be opened from anywhere (Navbar,
// checkout gate, orders page) and rendered once in the root layout.
export const useAuthModal = create((set) => ({
  open: false,
  next: null,
  openAuth: (next = null) => set({ open: true, next }),
  closeAuth: () => set({ open: false, next: null }),
}));
