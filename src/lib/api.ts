'use client';

import { Booking, Cabin, FinanceSummary, Passenger, Route, Ship, User, UserRecord, Withdrawal } from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api';

export interface ApiUserPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: User['role'];
  status?: User['status'];
  created_at?: string | null;
}

export interface ApiShipPayload {
  id: number;
  name: string;
  operator: string;
  owner_id: number;
  commission_rate?: number;
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

export interface ApiCabinHoldPayload {
  id: number;
  route_id: number;
  cabin_id: number;
  status: string;
  expires_at: string;
  hold_duration_minutes: number;
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
  payment_status?: Booking['paymentStatus'];
  invoice_available?: boolean;
  invoice_number?: string | null;
}

export interface ApiCreateBookingResponse {
  message: string;
  booking: ApiBookingPayload;
  payment_url?: string | null;
  payment_status?: string | null;
}

export interface ApiFinanceSummaryPayload {
  gross_earnings: number;
  platform_commission: number;
  shipowner_earnings: number;
  pending_withdrawals: number;
  completed_withdrawals: number;
  available_to_withdraw: number;
}

export interface ApiWithdrawalPayload {
  id: number;
  shipowner_id: number;
  amount: number;
  status: Withdrawal['status'];
  note?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
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

const getFilenameFromDisposition = (value: string | null) => {
  if (!value) {
    return null;
  }
  const match = value.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? null;
};

export const downloadBookingInvoice = async (bookingId: string) => {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}/bookings/${bookingId}/invoice`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to download invoice'));
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download =
    getFilenameFromDisposition(response.headers.get('Content-Disposition')) ??
    `booking-${bookingId}-invoice.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const createCabinHold = (routeId: string, cabinId: string) =>
  apiFetch<ApiCabinHoldPayload>('/cabin-holds', {
    method: 'POST',
    body: JSON.stringify({
      route_id: Number(routeId),
      cabin_id: Number(cabinId),
    }),
  });

export const releaseCabinHold = (routeId: string, cabinId: string) =>
  apiFetch<{ message: string }>(`/cabin-holds?route_id=${routeId}&cabin_id=${cabinId}`, {
    method: 'DELETE',
  });

export const getFinanceSummary = () => apiFetch<ApiFinanceSummaryPayload>('/finance/summary');

export const getWithdrawals = () => apiFetch<ApiWithdrawalPayload[]>('/withdrawals');

export const createWithdrawal = (amount: number, note?: string) =>
  apiFetch<{ message: string; withdrawal: ApiWithdrawalPayload }>('/withdrawals', {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });

export const updateWithdrawal = (withdrawalId: string, status: Withdrawal['status'], note?: string) =>
  apiFetch<{ message: string; withdrawal: ApiWithdrawalPayload }>(`/withdrawals/${withdrawalId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });

export const mapApiUser = (apiUser: ApiUserPayload): User => ({
  id: apiUser.id.toString(),
  email: apiUser.email,
  name: [apiUser.first_name, apiUser.last_name].filter(Boolean).join(' ').trim(),
  phone: '',
  role: apiUser.role,
  status: apiUser.status ?? 'active',
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
  commissionRate: ship.commission_rate ?? 0,
  image: ship.image || '',
  description: ship.description || '',
  cabins: [],
  rating: ship.rating || 0,
  reviews: ship.review_count || 0,
  createdAt: ship.created_at || new Date().toISOString(),
  updatedAt: ship.created_at || new Date().toISOString(),
});

export const mapApiFinanceSummary = (summary: ApiFinanceSummaryPayload): FinanceSummary => ({
  grossEarnings: summary.gross_earnings,
  platformCommission: summary.platform_commission,
  shipownerEarnings: summary.shipowner_earnings,
  pendingWithdrawals: summary.pending_withdrawals,
  completedWithdrawals: summary.completed_withdrawals,
  availableToWithdraw: summary.available_to_withdraw,
});

export const mapApiWithdrawal = (withdrawal: ApiWithdrawalPayload): Withdrawal => ({
  id: withdrawal.id.toString(),
  shipownerId: withdrawal.shipowner_id.toString(),
  amount: withdrawal.amount,
  status: withdrawal.status,
  note: withdrawal.note ?? null,
  createdAt: withdrawal.created_at || new Date().toISOString(),
  processedAt: withdrawal.processed_at ?? null,
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
  paymentStatus: booking.payment_status ?? null,
  invoiceAvailable: booking.invoice_available ?? false,
  invoiceNumber: booking.invoice_number ?? null,
  createdAt: booking.created_at || new Date().toISOString(),
  updatedAt: booking.created_at || new Date().toISOString(),
});
