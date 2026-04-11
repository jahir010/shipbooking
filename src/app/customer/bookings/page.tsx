'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { useRouteStore } from '@/store/routeStore';
import { useShipStore } from '@/store/shipStore';
import { Booking } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { CABIN_TYPES } from '@/lib/mockData';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const getStatusVariant = (status: Booking['status']) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
};

export default function CustomerBookingsPage() {
  const { user } = useAuthStore();
  const { bookings, loading: bookingsLoading, fetchBookings, cancelBooking } = useBookingStore();
  const { ships, fetchShips } = useShipStore();
  const { routes, fetchRoutes } = useRouteStore();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    Promise.all([fetchBookings(), fetchShips(), fetchRoutes()]).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load bookings');
    });
  }, [fetchBookings, fetchRoutes, fetchShips]);

  const userBookings = useMemo(() => {
    if (!user) {
      return [];
    }
    return bookings.filter((booking) => booking.userId === user.id);
  }, [bookings, user]);

  if (!user || user.role !== 'customer') {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <Card className='p-8 text-center max-w-md'>
          <h1 className='text-2xl font-bold text-gray-900'>Customer Access Only</h1>
          <p className='mt-3 text-gray-600'>Please log in with a customer account to view bookings.</p>
          <Link href='/login' className='inline-block mt-6'>
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleCopyBookingId = async (bookingId: string) => {
    await navigator.clipboard.writeText(bookingId);
    toast.success('Booking ID copied');
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      setSelectedBooking((current) =>
        current && current.id === bookingId ? { ...current, status: 'cancelled' } : current,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-blue-600 text-white py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold'>My Bookings</h1>
          <p className='text-blue-100 mt-2'>Track your reservations and manage active trips.</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        {bookingsLoading ? (
          <Card className='p-12 text-center'>
            <p className='text-gray-500'>Loading your bookings...</p>
          </Card>
        ) : userBookings.length === 0 ? (
          <Card className='p-12 text-center'>
            <p className='text-gray-500 mb-4'>You have not booked a route yet.</p>
            <Link href='/customer/dashboard'>
              <Button>Browse Routes</Button>
            </Link>
          </Card>
        ) : (
          <div className='space-y-4'>
            {userBookings.map((booking) => {
              const route = routes.find((item) => item.id === booking.routeId);
              const ship = ships.find((item) => item.id === route?.shipId);
              return (
                <Card key={booking.id} className='p-6 hover:shadow-lg transition'>
                  <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h2 className='text-xl font-bold'>{ship?.name || 'Unknown ship'}</h2>
                        <Badge variant={getStatusVariant(booking.status)}>
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-600 mb-4'>{ship?.operator || 'Unknown operator'}</p>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                        <div>
                          <p className='text-gray-500'>Booking ID</p>
                          <p className='font-semibold'>{booking.id.slice(0, 8)}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Route</p>
                          <p className='font-semibold'>
                            {route ? `${route.departurePort} to ${route.destinationPort}` : 'Unknown route'}
                          </p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Passengers</p>
                          <p className='font-semibold'>{booking.passengers.length}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Total</p>
                          <p className='font-semibold text-blue-600'>
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        variant='secondary'
                        onClick={() => handleCopyBookingId(booking.id)}
                        title='Copy booking ID'
                      >
                        <Copy size={18} />
                      </Button>
                      <Button onClick={() => setSelectedBooking(booking)}>
                        <Eye size={18} />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        title='Booking Details'
        size='lg'
      >
        {selectedBooking && (
          <div className='space-y-6'>
            <div className='flex justify-between items-start gap-4'>
              <div>
                <p className='text-sm text-gray-600'>Booking ID</p>
                <p className='text-xl font-mono font-bold'>{selectedBooking.id}</p>
                <p className='text-sm text-gray-500 mt-2'>
                  Created {formatDateTime(selectedBooking.createdAt)}
                </p>
              </div>
              <Badge variant={getStatusVariant(selectedBooking.status)}>
                {selectedBooking.status.toUpperCase()}
              </Badge>
            </div>

            <div>
              <h3 className='font-bold mb-3'>Cabins</h3>
              <div className='space-y-2'>
                {selectedBooking.items.map((item) => (
                  <div
                    key={`${item.cabinId}-${item.cabinNumber}`}
                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                  >
                    <div>
                      <p className='font-semibold'>{CABIN_TYPES[item.cabinType].name}</p>
                      <p className='text-sm text-gray-600'>Cabin {item.cabinNumber}</p>
                    </div>
                    <p className='font-semibold'>
                      {formatCurrency(item.quantity * item.pricePerUnit)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className='font-bold mb-3'>Passengers</h3>
              <div className='space-y-2'>
                {selectedBooking.passengers.map((passenger, index) => (
                  <div key={`${passenger.email}-${index}`} className='rounded-lg bg-gray-50 p-3'>
                    <p className='font-semibold'>
                      {passenger.firstName} {passenger.lastName}
                    </p>
                    <p className='text-sm text-gray-600'>{passenger.email}</p>
                    <p className='text-sm text-gray-600'>{passenger.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='border-t pt-4'>
              <div className='flex justify-between text-lg font-bold'>
                <p>Total</p>
                <p className='text-blue-600'>{formatCurrency(selectedBooking.totalPrice)}</p>
              </div>
            </div>

            {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
              <Button
                fullWidth
                variant='danger'
                onClick={() => void handleCancelBooking(selectedBooking.id)}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
