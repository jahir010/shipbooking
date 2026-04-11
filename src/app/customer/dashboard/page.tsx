'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';
import { useShipStore } from '@/store/shipStore';
import { useRouteStore } from '@/store/routeStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { calculateDuration, formatCurrency } from '@/lib/utils';

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
    return routes.filter((route) => {
      const matchesDeparture =
        !search.departure ||
        route.departurePort.toLowerCase().includes(search.departure.toLowerCase());
      const matchesDestination =
        !search.destination ||
        route.destinationPort.toLowerCase().includes(search.destination.toLowerCase());
      const matchesDate = !search.date || route.date === search.date;

      return matchesDeparture && matchesDestination && matchesDate;
    });
  }, [routes, search]);

  if (!user || user.role !== 'customer') {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <Card className='p-8 text-center max-w-md'>
          <h1 className='text-2xl font-bold text-gray-900'>Customer Access Only</h1>
          <p className='mt-3 text-gray-600'>
            Please log in with a customer account to browse and book routes.
          </p>
          <Link href='/login' className='inline-block mt-6'>
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isLoading = shipsLoading || routesLoading;

  const handleBooking = (routeId: string) => {
    localStorage.setItem('selectedRoute', routeId);
    router.push('/customer/booking');
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-blue-600 text-white py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold mb-2'>Welcome, {user.name}</h1>
          <p className='text-blue-100'>Find a route and book your next ship journey.</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <Card className='p-6 mb-8'>
          <h2 className='text-lg font-semibold mb-6'>Search Routes</h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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
            <div className='flex items-end'>
              <Button
                fullWidth
                variant='secondary'
                onClick={() => setSearch({ departure: '', destination: '', date: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold'>Available Routes</h2>
          <Link href='/customer/bookings'>
            <Button variant='secondary'>My Bookings</Button>
          </Link>
        </div>

        {isLoading ? (
          <Card className='p-12 text-center'>
            <p className='text-gray-500'>Loading routes...</p>
          </Card>
        ) : filteredRoutes.length === 0 ? (
          <Card className='p-12 text-center'>
            <p className='text-gray-500'>No routes match your filters yet.</p>
          </Card>
        ) : (
          <div className='space-y-4'>
            {filteredRoutes.map((route) => {
              const ship = ships.find((item) => item.id === route.shipId);
              return (
                <Card key={route.id} className='p-6 hover:shadow-lg transition'>
                  <div className='flex flex-col lg:flex-row gap-6'>
                    <div className='lg:w-56 shrink-0'>
                      <div className='h-40 rounded-lg overflow-hidden bg-slate-200'>
                        {ship?.image ? (
                          <img
                            src={ship.image}
                            alt={ship.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-slate-500'>
                            No image
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex-1'>
                      <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4'>
                        <div>
                          <h3 className='text-xl font-bold text-gray-900'>
                            {ship?.name || 'Unknown Ship'}
                          </h3>
                          <p className='text-sm text-gray-600'>{ship?.operator || 'Unknown operator'}</p>
                        </div>
                        {ship && (
                          <div className='flex items-center gap-1 text-sm'>
                            <Star size={16} className='text-yellow-500 fill-yellow-500' />
                            <span className='font-semibold'>{ship.rating.toFixed(1)}</span>
                            <span className='text-gray-500'>({ship.reviews} reviews)</span>
                          </div>
                        )}
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm'>
                        <div>
                          <p className='text-gray-500'>From</p>
                          <p className='font-semibold'>{route.departurePort}</p>
                          <p className='text-gray-600'>{route.departureTime}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>To</p>
                          <p className='font-semibold'>{route.destinationPort}</p>
                          <p className='text-gray-600'>{route.arrivalTime}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Duration</p>
                          <p className='font-semibold'>{calculateDuration(route.duration)}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Seats Left</p>
                          <p className='font-semibold'>
                            {route.seatsAvailable} / {route.totalSeats}
                          </p>
                        </div>
                      </div>

                      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div>
                          <p className='text-sm text-gray-600'>Starting from</p>
                          <p className='text-2xl font-bold text-blue-600'>
                            {formatCurrency(route.basePrice)}
                          </p>
                        </div>
                        <Button onClick={() => handleBooking(route.id)}>Book Now</Button>
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
