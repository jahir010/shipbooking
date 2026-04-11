'use client';

import { create } from 'zustand';
import { Cabin } from '@/types';
import { apiFetch, ApiCabinPayload, mapApiCabin } from '@/lib/api';

interface CabinCreateInput {
  shipId: string;
  type: Cabin['type'];
  number: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
}

interface CabinState {
  cabins: Cabin[];
  loading: boolean;
  fetchCabins: () => Promise<void>;
  addCabin: (cabin: CabinCreateInput) => Promise<Cabin>;
  removeCabin: (cabinId: string) => Promise<void>;
}

export const useCabinStore = create<CabinState>((set) => ({
  cabins: [],
  loading: false,

  fetchCabins: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<ApiCabinPayload[]>('/cabins', { auth: false });
      set({ cabins: data.map(mapApiCabin) });
    } finally {
      set({ loading: false });
    }
  },

  addCabin: async (cabin) => {
    const data = await apiFetch<ApiCabinPayload>('/cabins', {
      method: 'POST',
      body: JSON.stringify({
        ship_id: Number(cabin.shipId),
        type: cabin.type,
        number: cabin.number,
        capacity: cabin.capacity,
        base_price: cabin.basePrice,
        amenities: cabin.amenities,
      }),
    });
    const newCabin = mapApiCabin(data);
    set((state) => ({ cabins: [...state.cabins, newCabin] }));
    return newCabin;
  },

  removeCabin: async (cabinId) => {
    await apiFetch<{ message: string }>(`/cabins/${cabinId}`, {
      method: 'DELETE',
    });
    set((state) => ({ cabins: state.cabins.filter((cabin) => cabin.id !== cabinId) }));
  },
}));
