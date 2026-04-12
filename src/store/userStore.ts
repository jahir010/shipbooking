'use client';

import { create } from 'zustand';
import { UserRecord, UserRole, UserStatus } from '@/types';
import { apiFetch, ApiUserPayload, mapApiUserRecord } from '@/lib/api';

interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

interface UserState {
  users: UserRecord[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  createUser: (input: UserCreateInput) => Promise<UserRecord>;
  updateUser: (userId: string, input: UserUpdateInput) => Promise<UserRecord>;
  deleteUser: (userId: string) => Promise<void>;
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

  createUser: async (input) => {
    const data = await apiFetch<{ message: string; user: ApiUserPayload }>('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        first_name: input.firstName,
        last_name: input.lastName,
        role: input.role,
        status: input.status,
      }),
    });
    const createdUser = mapApiUserRecord(data.user);
    set((state) => ({ users: [createdUser, ...state.users] }));
    return createdUser;
  },

  updateUser: async (userId, input) => {
    const data = await apiFetch<{ message: string; user: ApiUserPayload }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        first_name: input.firstName,
        last_name: input.lastName,
        role: input.role,
        status: input.status,
        password: input.password,
      }),
    });
    const updatedUser = mapApiUserRecord(data.user);
    set((state) => ({
      users: state.users.map((user) => (user.id === userId ? updatedUser : user)),
    }));
    return updatedUser;
  },

  deleteUser: async (userId) => {
    await apiFetch<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
    set((state) => ({
      users: state.users.filter((user) => user.id !== userId),
    }));
  },
}));
