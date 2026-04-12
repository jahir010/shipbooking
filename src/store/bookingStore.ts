'use client';

import { create } from 'zustand';
import { Booking } from '@/types';
import { apiFetch, ApiBookingPayload, ApiCreateBookingResponse, mapApiBooking } from '@/lib/api';

interface BookingCreateResult {
  booking: Booking;
  paymentUrl: string | null;
  paymentStatus: string | null;
}

interface BookingCreateInput {
  userId: string;
  routeId: string;
  items: Booking['items'];
  totalPrice: number;
  status: Booking['status'];
  passengers: Booking['passengers'];
  paymentMethod?: 'sslcommerz';
}

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  fetchBookings: () => Promise<void>;
  createBooking: (booking: BookingCreateInput) => Promise<BookingCreateResult>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  loading: false,

  fetchBookings: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<ApiBookingPayload[]>('/bookings');
      set({ bookings: data.map(mapApiBooking) });
    } finally {
      set({ loading: false });
    }
  },

  createBooking: async (booking) => {
    const data = await apiFetch<ApiCreateBookingResponse>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        route_id: Number(booking.routeId),
        items: booking.items.map((item) => ({
          cabin_id: Number(item.cabinId),
          cabin_type: item.cabinType,
          cabin_number: item.cabinNumber,
          quantity: item.quantity,
          price_per_unit: item.pricePerUnit,
        })),
        total_price: booking.totalPrice,
        status: booking.status,
        payment_method: booking.paymentMethod ?? 'sslcommerz',
        passengers: booking.passengers.map((passenger) => ({
          first_name: passenger.firstName,
          last_name: passenger.lastName,
          email: passenger.email,
          phone: passenger.phone,
          age: passenger.age,
          document_type: passenger.documentType,
          document_number: passenger.documentNumber,
          gender: passenger.gender,
        })),
      }),
    });
    const newBooking = mapApiBooking(data.booking);
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return {
      booking: newBooking,
      paymentUrl: data.payment_url ?? null,
      paymentStatus: data.payment_status ?? null,
    };
  },

  cancelBooking: async (bookingId) => {
    const data = await apiFetch<ApiBookingPayload>(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
    });
    const updatedBooking = mapApiBooking(data);
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId ? updatedBooking : booking,
      ),
    }));
  },

  updateBookingStatus: async (bookingId, status) => {
    const data = await apiFetch<ApiBookingPayload>(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    const updatedBooking = mapApiBooking(data);
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId ? updatedBooking : booking,
      ),
    }));
  },

  deleteBooking: async (bookingId) => {
    await apiFetch<{ message: string }>(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    set((state) => ({
      bookings: state.bookings.filter((booking) => booking.id !== bookingId),
    }));
  },
}));
