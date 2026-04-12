'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Compass, MapPin, Star, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';
import { useShipStore } from '@/store/shipStore';
import { useRouteStore } from '@/store/routeStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import PageHero from '@/components/layout/PageHero';
import { calculateDuration, formatCurrency, formatDate } from '@/lib/utils';

interface SearchFilter {
  departure: string;
  destination: string;
  date: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { ships, loading: shipsLoading, fetchShips } = useShipStore();
  const { routes, loading: routesLoading, fetchRoutes } = useRouteStore();
  const [search, setSearch] = useState<SearchFilter>({
    departure: '',
    destination: '',
    date: '',
  });

  useEffect(() => {
    Promise.all([fetchShips(), fetchRoutes()]).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load routes');
    });
  }, [fetchRoutes, fetchShips]);

  const filteredRoutes = useMemo(() => {
    return routes
      .filter((route) => route.status === 'active' && route.seatsAvailable > 0)
      .filter((route) => {
        const matchesDeparture =
          !search.departure ||
          route.departurePort.toLowerCase().includes(search.departure.toLowerCase());
        const matchesDestination =
          !search.destination ||
          route.destinationPort.toLowerCase().includes(search.destination.toLowerCase());
        const matchesDate = !search.date || route.date === search.date;

        return matchesDeparture && matchesDestination && matchesDate;
      })
      .sort((left, right) =>
        `${left.date} ${left.departureTime}`.localeCompare(`${right.date} ${right.departureTime}`),
      );
  }, [routes, search]);

  if (!user || user.role !== 'customer') {
    return (
      <div className='page-shell min-h-screen px-4 py-10 lg:px-8'>
        <div className='mx-auto max-w-xl'>
          <Card className='p-10 text-center'>
            <h1 className='font-display text-4xl font-semibold text-[#0f3b68]'>Customer Access Only</h1>
            <p className='mt-4 text-base leading-7 text-slate-600'>
              Please log in with a customer account to browse and book routes.
            </p>
            <Link href='/login' className='mt-6 inline-block'>
              <Button>Go to Login</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const isLoading = shipsLoading || routesLoading;

  const handleBooking = (routeId: string) => {
    localStorage.setItem('selectedRoute', routeId);
    router.push('/customer/booking');
  };

  return (
    <div className='page-shell min-h-screen px-4 py-6 lg:px-8 lg:py-8'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <PageHero
          eyebrow='Passenger dashboard'
          title={`Find your next departure, ${user.name}.`}
          description='Search live voyages, compare ship details, and move from discovery to booking without leaving the same editorial-style flow.'
          actions={
            <>
              <Link href='/customer/bookings'>
                <Button variant='secondary'>My Bookings</Button>
              </Link>
              <Link href='/signup/shipowner'>
                <Button className='bg-white text-[#0f3b68] hover:bg-[#ecf5f7]'>Become a Partner</Button>
              </Link>
            </>
          }
          stats={[
            { label: 'Active Voyages', value: filteredRoutes.length },
            { label: 'Available Ships', value: ships.length },
            { label: 'Open Seats', value: filteredRoutes.reduce((sum, route) => sum + route.seatsAvailable, 0) },
          ]}
        />

        <Card className='p-6 lg:p-7'>
          <div className='mb-6 flex items-end justify-between gap-4'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[#1d7e93]'>
                Voyage search
              </p>
              <h2 className='mt-2 font-display text-4xl font-semibold text-[#0f3b68]'>
                Filter Scheduled Routes
              </h2>
            </div>
            <Button
              variant='secondary'
              onClick={() => setSearch({ departure: '', destination: '', date: '' })}
            >
              Clear Filters
            </Button>
          </div>

          <div className='grid gap-4 md:grid-cols-3 lg:grid-cols-4'>
            <Input
              label='Departure Port'
              placeholder='From'
              value={search.departure}
              onChange={(event) =>
                setSearch((current) => ({ ...current, departure: event.target.value }))
              }
            />
            <Input
              label='Destination Port'
              placeholder='To'
              value={search.destination}
              onChange={(event) =>
                setSearch((current) => ({ ...current, destination: event.target.value }))
              }
            />
            <Input
              type='date'
              label='Date'
              value={search.date}
              onChange={(event) =>
                setSearch((current) => ({ ...current, date: event.target.value }))
              }
            />
            <div className='rounded-[1.7rem] border border-[#d9e4e8] bg-[#eef7f8] p-4 text-sm leading-7 text-slate-600'>
              Editorial search keeps routes, cabins, and booking context in one place.
            </div>
          </div>
        </Card>

        <div className='flex items-end justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[#1d7e93]'>
              Live departures
            </p>
            <h2 className='mt-2 font-display text-4xl font-semibold text-[#0f3b68]'>
              Available Routes
            </h2>
          </div>
        </div>

        {isLoading ? (
          <Card className='p-12 text-center text-slate-500'>Loading routes...</Card>
        ) : filteredRoutes.length === 0 ? (
          <Card className='p-12 text-center text-slate-500'>
            No routes match your current filters yet.
          </Card>
        ) : (
          <div className='space-y-5'>
            {filteredRoutes.map((route) => {
              const ship = ships.find((item) => item.id === route.shipId);
              return (
                <Card key={route.id} className='overflow-hidden p-5 lg:p-6'>
                  <div className='grid gap-6 lg:grid-cols-[240px_1fr]'>
                    <div className='h-52 overflow-hidden rounded-[1.7rem] bg-slate-200'>
                      {ship?.image ? (
                        <img src={ship.image} alt={ship.name} className='h-full w-full object-cover' />
                      ) : (
                        <div className='flex h-full items-center justify-center text-slate-500'>No image</div>
                      )}
                    </div>

                    <div className='space-y-5'>
                      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                        <div>
                          <h3 className='text-2xl font-semibold text-[#0f3b68]'>
                            {ship?.name || 'Unknown Ship'}
                          </h3>
                          <p className='mt-1 text-sm text-slate-600'>
                            {ship?.operator || 'Unknown operator'}
                          </p>
                        </div>
                        {ship ? (
                          <div className='flex items-center gap-2 rounded-full bg-[#eef7f8] px-4 py-2 text-sm font-semibold text-[#145a73]'>
                            <Star size={16} className='fill-current' />
                            {ship.rating.toFixed(1)} rating
                          </div>
                        ) : null}
                      </div>

                      <div className='grid gap-4 md:grid-cols-5'>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7d92a2]'>From</p>
                          <p className='mt-3 font-semibold text-[#0f3b68]'>{route.departurePort}</p>
                          <p className='text-sm text-slate-500'>{route.departureTime}</p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7d92a2]'>To</p>
                          <p className='mt-3 font-semibold text-[#0f3b68]'>{route.destinationPort}</p>
                          <p className='text-sm text-slate-500'>{route.arrivalTime}</p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7d92a2]'>Date</p>
                          <p className='mt-3 flex items-center gap-2 font-semibold text-[#0f3b68]'>
                            <CalendarDays size={15} className='text-[#1d7e93]' />
                            {formatDate(route.date)}
                          </p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7d92a2]'>Duration</p>
                          <p className='mt-3 flex items-center gap-2 font-semibold text-[#0f3b68]'>
                            <Compass size={15} className='text-[#1d7e93]' />
                            {calculateDuration(route.duration)}
                          </p>
                        </div>
                        <div className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7d92a2]'>Seats Left</p>
                          <p className='mt-3 flex items-center gap-2 font-semibold text-[#0f3b68]'>
                            <Users size={15} className='text-[#1d7e93]' />
                            {route.seatsAvailable}/{route.totalSeats}
                          </p>
                        </div>
                      </div>

                      <div className='flex flex-col gap-4 border-t border-[#dde7eb] pt-5 md:flex-row md:items-center md:justify-between'>
                        <div>
                          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7d92a2]'>Starting from</p>
                          <p className='mt-2 text-3xl font-semibold text-[#0f3b68]'>
                            {formatCurrency(route.basePrice)}
                          </p>
                        </div>
                        <div className='flex gap-3'>
                          <button
                            type='button'
                            className='inline-flex items-center gap-2 rounded-full bg-[#eef7f8] px-4 py-3 text-sm font-semibold text-[#145a73]'
                          >
                            <MapPin size={15} />
                            {route.departurePort} to {route.destinationPort}
                          </button>
                          <Button onClick={() => handleBooking(route.id)}>Book Upcoming Trip</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
