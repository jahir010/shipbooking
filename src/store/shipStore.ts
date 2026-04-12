'use client';

import { create } from 'zustand';
import { Ship } from '@/types';
import { apiFetch, ApiShipPayload, mapApiShip } from '@/lib/api';

interface ShipCreateInput {
  name: string;
  operator: string;
  image: string;
  description: string;
  commissionRate?: number;
  rating?: number;
  reviewCount?: number;
}

interface ShipState {
  ships: Ship[];
  loading: boolean;
  fetchShips: () => Promise<void>;
  addShip: (ship: ShipCreateInput) => Promise<Ship>;
  removeShip: (shipId: string) => Promise<void>;
}

export const useShipStore = create<ShipState>((set) => ({
  ships: [],
  loading: false,

  fetchShips: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<ApiShipPayload[]>('/ships', { auth: false });
      set({ ships: data.map(mapApiShip) });
    } finally {
      set({ loading: false });
    }
  },

  addShip: async (ship) => {
    const data = await apiFetch<ApiShipPayload>('/ships', {
      method: 'POST',
      body: JSON.stringify({
        name: ship.name,
        operator: ship.operator,
        commission_rate: ship.commissionRate ?? 0,
        image: ship.image,
        description: ship.description,
        rating: ship.rating ?? 0,
        review_count: ship.reviewCount ?? 0,
      }),
    });
    const newShip = mapApiShip(data);
    set((state) => ({ ships: [...state.ships, newShip] }));
    return newShip;
  },

  removeShip: async (shipId) => {
    await apiFetch<{ message: string }>(`/ships/${shipId}`, {
      method: 'DELETE',
    });
    set((state) => ({ ships: state.ships.filter((ship) => ship.id !== shipId) }));
  },
}));
