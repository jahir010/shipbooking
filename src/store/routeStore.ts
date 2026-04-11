'use client';

import { create } from 'zustand';
import { Route } from '@/types';
import { apiFetch, ApiRoutePayload, mapApiRoute } from '@/lib/api';

interface RouteCreateInput {
  shipId: string;
  departurePort: string;
  destinationPort: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  date: string;
  seatsAvailable: number;
  totalSeats: number;
  basePrice: number;
  status?: Route['status'];
}

interface RouteState {
  routes: Route[];
  loading: boolean;
  fetchRoutes: () => Promise<void>;
  addRoute: (route: RouteCreateInput) => Promise<Route>;
  removeRoute: (routeId: string) => Promise<void>;
}

export const useRouteStore = create<RouteState>((set) => ({
  routes: [],
  loading: false,

  fetchRoutes: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<ApiRoutePayload[]>('/routes', { auth: false });
      set({ routes: data.map(mapApiRoute) });
    } finally {
      set({ loading: false });
    }
  },

  addRoute: async (route) => {
    const data = await apiFetch<ApiRoutePayload>('/routes', {
      method: 'POST',
      body: JSON.stringify({
        ship_id: Number(route.shipId),
        departure_port: route.departurePort,
        destination_port: route.destinationPort,
        departure_time: route.departureTime,
        arrival_time: route.arrivalTime,
        duration: route.duration,
        date: route.date,
        seats_available: route.seatsAvailable,
        total_seats: route.totalSeats,
        base_price: route.basePrice,
        status: route.status ?? 'active',
      }),
    });
    const newRoute = mapApiRoute(data);
    set((state) => ({ routes: [...state.routes, newRoute] }));
    return newRoute;
  },

  removeRoute: async (routeId) => {
    await apiFetch<{ message: string }>(`/routes/${routeId}`, {
      method: 'DELETE',
    });
    set((state) => ({ routes: state.routes.filter((route) => route.id !== routeId) }));
  },
}));
