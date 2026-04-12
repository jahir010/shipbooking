'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Copy, Download, Eye, Ticket } from 'lucide-react';
import { toast } from 'react-toastify';
import { downloadBookingInvoice } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { useRouteStore } from '@/store/routeStore';
import { useShipStore } from '@/store/shipStore';
import { Booking } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import PageHero from '@/components/layout/PageHero';
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
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { bookings, loading: bookingsLoading, fetchBookings, cancelBooking } = useBookingStore();
  const { ships, fetchShips } = useShipStore();
  const { routes, fetchRoutes } = useRouteStore();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    Promise.all([fetchBookings(), fetchShips(), fetchRoutes({ includePast: true })]).catch(
      (error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Failed to load bookings');
      },
    );
  }, [fetchBookings, fetchRoutes, fetchShips]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (!paymentStatus) {
      return;
    }

    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully');
      return;
    }
    if (paymentStatus === 'failed') {
      toast.error('Payment failed. Your booking was cancelled.');
      return;
    }
    if (paymentStatus === 'cancelled') {
      toast.info('Payment was cancelled and the booking was released.');
      return;
    }
    if (paymentStatus === 'pending') {
      toast.info('Booking created. Payment is still pending.');
    }
  }, [searchParams]);

  const userBookings = useMemo(() => {
    if (!user) {
      return [];
    }
    return bookings.filter((booking) => booking.userId === user.id);
  }, [bookings, user]);

  if (!user || user.role !== 'customer') {
    return (
      <div className='page-shell min-h-screen px-4 py-10 lg:px-8'>
        <div className='mx-auto max-w-xl'>
          <Card className='p-10 text-center'>
            <h1 className='font-display text-4xl font-semibold text-[#0f3b68]'>Customer Access Only</h1>
            <p className='mt-4 text-base leading-7 text-slate-600'>
              Please log in with a customer account to view bookings.
            </p>
            <Link href='/login' className='mt-6 inline-block'>
              <Button>Go to Login</Button>
            </Link>
          </Card>
        </div>
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

  const handleDownloadInvoice = async (booking: Booking) => {
    try {
      await downloadBookingInvoice(booking.id);
      toast.success(
        booking.invoiceNumber ? `Invoice ${booking.invoiceNumber} downloaded` : 'Invoice downloaded',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice');
    }
  };

  return (
    <div className='page-shell min-h-screen px-4 py-6 lg:px-8 lg:py-8'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <PageHero
          eyebrow='Passenger archive'
          title='Every reservation in one place.'
          description='Track payment outcomes, revisit voyage details, and download invoices from a booking history that now carries the same premium flow as the public experience.'
          actions={
            <Link href='/customer/dashboard'>
              <Button variant='secondary'>Browse Routes</Button>
            </Link>
          }
          stats={[
            { label: 'Bookings', value: userBookings.length },
            { label: 'Invoices Ready', value: userBookings.filter((booking) => booking.invoiceAvailable).length },
            { label: 'Confirmed Trips', value: userBookings.filter((booking) => booking.status === 'confirmed').length },
          ]}
        />

        {bookingsLoading ? (
          <Card className='p-12 text-center text-slate-500'>Loading your bookings...</Card>
        ) : userBookings.length === 0 ? (
          <Card className='p-12 text-center'>
            <p className='text-lg text-slate-600'>You have not booked a route yet.</p>
            <Link href='/customer/dashboard' className='mt-5 inline-block'>
              <Button>Browse Routes</Button>
            </Link>
          </Card>
        ) : (
          <div className='space-y-5'>
            {userBookings.map((booking) => {
              const route = routes.find((item) => item.id === booking.routeId);
              const ship = ships.find((item) => item.id === route?.shipId);
              return (
                <Card key={booking.id} className='p-6 lg:p-7'>
                  <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='flex-1'>
                      <div className='mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                        <div>
                          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[#7b91a1]'>
                            Booking record
                          </p>
                          <h2 className='mt-2 text-2xl font-semibold text-[#0f3b68]'>
                            {ship?.name || 'Unknown ship'}
                          </h2>
                          <p className='mt-1 text-sm text-slate-600'>
                            {ship?.operator || 'Unknown operator'}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(booking.status)}>
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className='grid gap-4 md:grid-cols-4'>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#7b91a1]'>Booking ID</p>
                          <p className='mt-3 font-semibold text-[#0f3b68]'>{booking.id.slice(0, 8)}</p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#7b91a1]'>Route</p>
                          <p className='mt-3 font-semibold text-[#0f3b68]'>
                            {route ? `${route.departurePort} to ${route.destinationPort}` : 'Unknown route'}
                          </p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#7b91a1]'>Passengers</p>
                          <p className='mt-3 font-semibold text-[#0f3b68]'>{booking.passengers.length}</p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#7b91a1]'>Total</p>
                          <p className='mt-3 text-xl font-semibold text-[#0f3b68]'>
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      {booking.invoiceAvailable ? (
                        <Button variant='secondary' onClick={() => void handleDownloadInvoice(booking)}>
                          <Download size={18} />
                          Invoice
                        </Button>
                      ) : null}
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

      <Modal isOpen={selectedBooking !== null} onClose={() => setSelectedBooking(null)} title='Booking Details' size='lg'>
        {selectedBooking ? (
          <div className='space-y-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7b91a1]'>Booking ID</p>
                <p className='mt-2 text-xl font-mono font-bold text-[#0f3b68]'>{selectedBooking.id}</p>
                <p className='mt-2 text-sm text-slate-500'>
                  Created {formatDateTime(selectedBooking.createdAt)}
                </p>
              </div>
              <Badge variant={getStatusVariant(selectedBooking.status)}>
                {selectedBooking.status.toUpperCase()}
              </Badge>
            </div>

            <div>
              <h3 className='font-display text-3xl font-semibold text-[#0f3b68]'>Cabins</h3>
              <div className='mt-4 space-y-3'>
                {selectedBooking.items.map((item) => (
                  <div key={`${item.cabinId}-${item.cabinNumber}`} className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                    <div className='flex items-center justify-between gap-4'>
                      <div>
                        <p className='font-semibold text-[#0f3b68]'>{CABIN_TYPES[item.cabinType].name}</p>
                        <p className='text-sm text-slate-600'>Cabin {item.cabinNumber}</p>
                      </div>
                      <p className='font-semibold text-[#0f3b68]'>
                        {formatCurrency(item.quantity * item.pricePerUnit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className='font-display text-3xl font-semibold text-[#0f3b68]'>Passengers</h3>
              <div className='mt-4 space-y-3'>
                {selectedBooking.passengers.map((passenger, index) => (
                  <div key={`${passenger.email}-${index}`} className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                    <p className='font-semibold text-[#0f3b68]'>
                      {passenger.firstName} {passenger.lastName}
                    </p>
                    <p className='mt-1 text-sm text-slate-600'>{passenger.email}</p>
                    <p className='text-sm text-slate-600'>{passenger.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='border-t border-[#dde7eb] pt-4'>
              <div className='flex justify-between text-lg font-bold text-[#0f3b68]'>
                <p>Total</p>
                <p>{formatCurrency(selectedBooking.totalPrice)}</p>
              </div>
            </div>

            {selectedBooking.invoiceAvailable ? (
              <Button fullWidth variant='secondary' onClick={() => void handleDownloadInvoice(selectedBooking)}>
                <Download size={18} />
                Download Invoice
              </Button>
            ) : null}

            {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') ? (
              <Button fullWidth variant='danger' onClick={() => void handleCancelBooking(selectedBooking.id)}>
                <Ticket size={18} />
                Cancel Booking
              </Button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
