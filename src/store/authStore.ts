'use client';

import { create } from 'zustand';
import { User } from '@/types';
import { apiFetch, ApiUserPayload, mapApiUser } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: Extract<User['role'], 'customer' | 'shipowner'>,
  ) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = await apiFetch<{ access_token: string; user: ApiUserPayload }>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    const user = mapApiUser(data.user);
    set({ user, isAuthenticated: true });
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('accessToken', data.access_token);
  },

  register: async (email, password, firstName, lastName, role) => {
    await apiFetch('/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      }),
    });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
    localStorage.setItem('authUser', JSON.stringify(user));
  },
}));

// Initialize auth from localStorage
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('authUser');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (!user.status) {
        user.status = 'active';
      }
      useAuthStore.setState({ user, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to parse saved user', e);
    }
  }
}
