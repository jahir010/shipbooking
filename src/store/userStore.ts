'use client';

import { create } from 'zustand';
import { UserRecord } from '@/types';
import { apiFetch, ApiUserPayload, mapApiUserRecord } from '@/lib/api';

interface UserState {
  users: UserRecord[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<ApiUserPayload[]>('/users');
      set({ users: data.map(mapApiUserRecord) });
    } finally {
      set({ loading: false });
    }
  },
}));
