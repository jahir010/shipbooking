'use client';

import { Booking, Cabin, Passenger, Route, Ship, User, UserRecord } from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api';

export interface ApiUserPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: User['role'];
  created_at?: string | null;
}

export interface ApiShipPayload {
  id: number;
  name: string;
  operator: string;
  owner_id: number;
  image: string;
  description: string;
  rating: number;
  review_count: number;
  created_at?: string | null;
}

export interface ApiRoutePayload {
  id: number;
  ship_id: number;
  departure_port: string;
  destination_port: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  date: string;
  seats_available: number;
  total_seats: number;
  base_price: number;
  status: Route['status'];
  created_at?: string | null;
}

export interface ApiCabinPayload {
  id: number;
  ship_id: number;
  type: Cabin['type'];
  number: string;
  capacity: number;
  base_price: number;
  amenities: string[];
}

export interface ApiBookingItemPayload {
  cabin_id: number;
  cabin_type: Booking['items'][number]['cabinType'];
  cabin_number: string;
  quantity: number;
  price_per_unit: number;
}

export interface ApiPassengerPayload {
  id?: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  age?: number;
  document_type?: string;
  document_number?: string;
  gender?: Passenger['gender'];
}

export interface ApiBookingPayload {
  id: number;
  user_id: number;
  route_id: number;
  items: ApiBookingItemPayload[];
  total_price: number;
  status: Booking['status'];
  passengers: ApiPassengerPayload[];
  created_at?: string | null;
}

const isFormData = (body: BodyInit | null | undefined): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData;

export const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('accessToken');
};

export const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data.detail || data.message || fallback;
  } catch {
    return fallback;
  }
};

export const apiFetch = async <T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> => {
  const headers = new Headers(init.headers ?? {});
  if (init.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  if (init.body && !isFormData(init.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Request failed'));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const mapApiUser = (apiUser: ApiUserPayload): User => ({
  id: apiUser.id.toString(),
  email: apiUser.email,
  name: [apiUser.first_name, apiUser.last_name].filter(Boolean).join(' ').trim(),
  phone: '',
  role: apiUser.role,
  createdAt: apiUser.created_at || new Date().toISOString(),
});

export const mapApiUserRecord = (apiUser: ApiUserPayload): UserRecord => ({
  ...mapApiUser(apiUser),
  firstName: apiUser.first_name,
  lastName: apiUser.last_name,
});

export const mapApiShip = (ship: ApiShipPayload): Ship => ({
  id: ship.id.toString(),
  name: ship.name,
  operator: ship.operator,
  ownerId: ship.owner_id.toString(),
  image: ship.image || '',
  description: ship.description || '',
  cabins: [],
  rating: ship.rating || 0,
  reviews: ship.review_count || 0,
  createdAt: ship.created_at || new Date().toISOString(),
  updatedAt: ship.created_at || new Date().toISOString(),
});

export const mapApiRoute = (route: ApiRoutePayload): Route => ({
  id: route.id.toString(),
  shipId: route.ship_id.toString(),
  departurePort: route.departure_port,
  destinationPort: route.destination_port,
  departureTime: route.departure_time,
  arrivalTime: route.arrival_time,
  duration: route.duration,
  date: route.date,
  seatsAvailable: route.seats_available,
  totalSeats: route.total_seats,
  basePrice: route.base_price,
  status: route.status,
  createdAt: route.created_at || new Date().toISOString(),
});

export const mapApiCabin = (cabin: ApiCabinPayload): Cabin => ({
  id: cabin.id.toString(),
  shipId: cabin.ship_id.toString(),
  type: cabin.type,
  number: cabin.number,
  capacity: cabin.capacity,
  basePrice: cabin.base_price,
  amenities: cabin.amenities || [],
});

export const mapApiPassenger = (
  passenger: ApiPassengerPayload,
  index: number,
): Passenger => ({
  id: passenger.id?.toString() || `${index}`,
  firstName: passenger.first_name ?? '',
  lastName: passenger.last_name ?? '',
  email: passenger.email ?? '',
  phone: passenger.phone ?? '',
  age: passenger.age ?? 0,
  documentType: passenger.document_type ?? '',
  documentNumber: passenger.document_number ?? '',
  gender: passenger.gender ?? 'other',
});

export const mapApiBooking = (booking: ApiBookingPayload): Booking => ({
  id: booking.id.toString(),
  userId: booking.user_id.toString(),
  routeId: booking.route_id.toString(),
  items: booking.items.map((item) => ({
    cabinId: item.cabin_id.toString(),
    cabinType: item.cabin_type,
    cabinNumber: item.cabin_number,
    quantity: item.quantity,
    pricePerUnit: item.price_per_unit,
  })),
  totalPrice: booking.total_price,
  status: booking.status,
  passengers: booking.passengers.map(mapApiPassenger),
  createdAt: booking.created_at || new Date().toISOString(),
  updatedAt: booking.created_at || new Date().toISOString(),
});
