'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Anchor, ArrowRight, CalendarDays, MapPin, Search, Ship, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useRouteStore } from '@/store/routeStore';
import { useShipStore } from '@/store/shipStore';
import { calculateDuration, formatCurrency, formatDate } from '@/lib/utils';

export default function Home() {
  const { user } = useAuthStore();
  const { routes, fetchRoutes } = useRouteStore();
  const { ships, fetchShips } = useShipStore();

  useEffect(() => {
    Promise.all([fetchRoutes(), fetchShips()]).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to load featured voyages');
    });
  }, [fetchRoutes, fetchShips]);

  const featuredRoutes = useMemo(() => routes.slice(0, 4), [routes]);

  const highlightedMetrics = useMemo(
    () => [
      { label: 'Live Routes', value: routes.length || 12 },
      { label: 'Verified Ships', value: ships.length || 8 },
      { label: 'Popular Ports', value: 6 },
    ],
    [routes.length, ships.length],
  );

  const getDashboardLink = () => {
    if (!user) {
      return '/signup';
    }
    if (user.role === 'customer') {
      return '/customer/dashboard';
    }
    if (user.role === 'shipowner') {
      return '/shipowner/dashboard';
    }
    return '/admin/dashboard';
  };

  return (
    <div className='page-shell'>
      <section className='relative overflow-hidden px-4 pb-16 pt-6 lg:px-8 lg:pb-24 lg:pt-8'>
        <div className='absolute inset-x-0 top-0 h-[720px] rounded-b-[3rem] bg-[url("https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1600&q=80")] bg-cover bg-center' />
        <div className='absolute inset-x-0 top-0 h-[720px] rounded-b-[3rem] bg-gradient-to-r from-[#0a2744]/84 via-[#0c4165]/52 to-[#0a2744]/24' />
        <div className='absolute inset-x-0 top-0 h-[720px] rounded-b-[3rem] bg-gradient-to-t from-[#081a2f]/30 via-transparent to-transparent' />

        <div className='relative mx-auto max-w-7xl'>
          <div className='grid gap-12 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-20'>
            <div className='max-w-3xl text-white'>
              <p className='text-sm font-semibold uppercase tracking-[0.35em] text-[#8ce7ea]'>
                Hatiya editorial
              </p>
              <h1 className='mt-5 font-display text-6xl font-semibold leading-[0.88] md:text-8xl'>
                The Soul of{' '}
                <span className='text-[#7ce4e7]'>Hatiya</span>
              </h1>
              <p className='mt-6 max-w-xl text-lg leading-8 text-white/78 md:text-xl'>
                Curated maritime journeys inspired by Bangladesh&apos;s coastal rhythm. Browse live
                departures, polished booking flows, and role-based operations that feel ready for a
                real production launch.
              </p>

              <div className='mt-8 flex flex-wrap gap-3'>
                <Link href={getDashboardLink()}>
                  <Button
                    size='lg'
                    className='rounded-full bg-white px-6 py-3 text-[#0f3b68] hover:bg-[#ecf5f7]'
                  >
                    {user ? 'Go to Dashboard' : 'Book a Ship'}
                  </Button>
                </Link>
                <Link href='/signup/shipowner'>
                  <Button
                    size='lg'
                    variant='secondary'
                    className='rounded-full border border-white/28 bg-white/10 px-6 py-3 text-white hover:bg-white/16'
                  >
                    Partner With Us
                  </Button>
                </Link>
              </div>

              <div className='mt-10 grid max-w-2xl gap-4 sm:grid-cols-3'>
                {highlightedMetrics.map((item) => (
                  <div
                    key={item.label}
                    className='rounded-[1.7rem] border border-white/14 bg-white/10 p-5 backdrop-blur-md'
                  >
                    <p className='text-3xl font-semibold text-white'>{item.value}</p>
                    <p className='mt-2 text-sm uppercase tracking-[0.2em] text-white/66'>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className='glass-panel rounded-[2rem] p-4 lg:p-5'>
              <div className='rounded-[1.6rem] bg-[#f4f2eb] p-5 shadow-[0_20px_60px_rgba(8,35,61,0.18)]'>
                <div className='mb-5 flex gap-2'>
                  <div className='rounded-full bg-[#0f3b68] px-4 py-2 text-sm font-semibold text-white'>
                    Book a Ship
                  </div>
                  <div className='rounded-full px-4 py-2 text-sm font-semibold text-[#5d7281]'>
                    Explore Hatiya
                  </div>
                </div>

                <div className='grid gap-3 md:grid-cols-4'>
                  {[
                    {
                      label: 'From',
                      value: featuredRoutes[0]?.departurePort ?? 'Chittagong',
                      icon: MapPin,
                    },
                    {
                      label: 'To',
                      value: featuredRoutes[0]?.destinationPort ?? 'Hatiya',
                      icon: Anchor,
                    },
                    {
                      label: 'Date',
                      value: featuredRoutes[0] ? formatDate(featuredRoutes[0].date) : 'Oct 24, 2024',
                      icon: CalendarDays,
                    },
                  ].map((field) => (
                    <div key={field.label} className='rounded-2xl bg-white px-4 py-4 shadow-sm'>
                      <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[#7991a1]'>
                        {field.label}
                      </p>
                      <div className='mt-3 flex items-center gap-2 text-sm font-semibold text-[#153a5f]'>
                        <field.icon size={16} className='text-[#1d7e93]' />
                        <span>{field.value}</span>
                      </div>
                    </div>
                  ))}

                  <Link href={user ? '/customer/dashboard' : '/signup'} className='block'>
                    <div className='flex h-full items-center justify-center rounded-2xl bg-[#0a8a8e] px-5 py-4 text-white shadow-lg shadow-[#0a8a8e]/20 hover:bg-[#08777a]'>
                      <div className='flex items-center gap-2 text-sm font-semibold'>
                        <Search size={16} />
                        Find Voyage
                      </div>
                    </div>
                  </Link>
                </div>

                <p className='mt-4 text-sm leading-6 text-[#6b7f8e]'>
                  Passenger signup stays customer-first on the main route, while shipowners and
                  internal admins follow their own production-style access paths.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='px-4 py-16 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.28em] text-[#1d7e93]'>
                Live departures
              </p>
              <h2 className='mt-3 font-display text-5xl font-semibold text-[#0f3b68]'>
                Scheduled Voyages
              </h2>
            </div>
            <Link
              href='/customer/dashboard'
              className='inline-flex items-center gap-2 text-sm font-semibold text-[#0f3b68] hover:text-[#1d7e93]'
            >
              View full schedule
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className='space-y-4'>
            {featuredRoutes.length === 0 ? (
              <div className='glass-panel rounded-[2rem] p-8 text-center text-slate-600'>
                Voyage data is loading. Once routes are available, featured departures will appear
                here automatically.
              </div>
            ) : (
              featuredRoutes.map((route) => {
                const ship = ships.find((item) => item.id === route.shipId);
                return (
                  <div
                    key={route.id}
                    className='glass-panel grid gap-5 rounded-[2rem] p-5 lg:grid-cols-[1.2fr_0.9fr_0.7fr_auto]'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#0f3b68] text-white'>
                        <Ship size={24} />
                      </div>
                      <div>
                        <p className='text-xl font-semibold text-[#0f3b68]'>
                          {ship?.name ?? 'Editorial Voyage'}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {ship?.operator ?? 'Coastal Passenger Service'}
                        </p>
                      </div>
                    </div>

                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                          Departure
                        </p>
                        <p className='mt-2 text-lg font-semibold text-[#0f3b68]'>
                          {route.departureTime}
                        </p>
                        <p className='text-sm text-slate-500'>{route.departurePort}</p>
                      </div>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                          Arrival
                        </p>
                        <p className='mt-2 text-lg font-semibold text-[#0f3b68]'>
                          {route.arrivalTime}
                        </p>
                        <p className='text-sm text-slate-500'>{route.destinationPort}</p>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='inline-flex items-center gap-2 rounded-full bg-[#e8f6f6] px-3 py-2 text-sm font-semibold text-[#1d7e93]'>
                        <Users size={14} />
                        {route.seatsAvailable} seats left
                      </div>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                          Starting from
                        </p>
                        <p className='mt-2 text-3xl font-semibold text-[#0f3b68]'>
                          {formatCurrency(route.basePrice)}
                        </p>
                        <p className='text-sm text-slate-500'>{calculateDuration(route.duration)}</p>
                      </div>
                    </div>

                    <div className='flex items-center'>
                      <Link href='/customer/dashboard'>
                        <Button className='rounded-full bg-[#0f3b68] px-6 py-3 text-white hover:bg-[#0a2c4f]'>
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 lg:px-8'>
        <div className='mx-auto grid max-w-7xl gap-6 lg:grid-cols-3'>
          {[
            {
              title: 'Customer-first onboarding',
              text: 'The primary signup flow now stays focused on real passenger use, with cleaner entry points and fewer confusing role choices.',
            },
            {
              title: 'Separate partner access',
              text: 'Shipowners get a dedicated signup route and a dashboard-centered operational experience instead of sharing the public passenger flow.',
            },
            {
              title: 'Production admin controls',
              text: 'Admins can provision users, suspend access, update roles, and remove accounts directly inside the platform management layer.',
            },
          ].map((item) => (
            <div key={item.title} className='rounded-[2rem] border border-white/50 bg-white/72 p-8 shadow-[0_20px_50px_rgba(15,59,104,0.08)] backdrop-blur-sm'>
              <h3 className='font-display text-3xl font-semibold text-[#0f3b68]'>{item.title}</h3>
              <p className='mt-4 text-base leading-8 text-slate-600'>{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
