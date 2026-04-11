'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { useCabinStore } from '@/store/cabinStore';
import { useRouteStore } from '@/store/routeStore';
import { useShipStore } from '@/store/shipStore';
import { Booking, CabinType } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { CABIN_TYPES } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';

type OwnerTab = 'ships' | 'routes' | 'cabins' | 'bookings';

const getBookingVariant = (status: Booking['status']) => {
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

const computeDurationHours = (departure: string, arrival: string) => {
  const [departureHour, departureMinute] = departure.split(':').map(Number);
  const [arrivalHour, arrivalMinute] = arrival.split(':').map(Number);

  const departureTotal = departureHour * 60 + departureMinute;
  let arrivalTotal = arrivalHour * 60 + arrivalMinute;
  if (arrivalTotal <= departureTotal) {
    arrivalTotal += 24 * 60;
  }

  return Number(((arrivalTotal - departureTotal) / 60).toFixed(2));
};

export default function ShipOwnerDashboard() {
  const { user } = useAuthStore();
  const { ships, loading: shipsLoading, fetchShips, addShip, removeShip } = useShipStore();
  const { routes, loading: routesLoading, fetchRoutes, addRoute, removeRoute } = useRouteStore();
  const { cabins, loading: cabinsLoading, fetchCabins, addCabin, removeCabin } = useCabinStore();
  const {
    bookings,
    loading: bookingsLoading,
    fetchBookings,
    updateBookingStatus,
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<OwnerTab>('ships');
  const [showShipModal, setShowShipModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [shipForm, setShipForm] = useState({
    name: '',
    operator: '',
    image: '',
    description: '',
  });
  const [routeForm, setRouteForm] = useState({
    shipId: '',
    departurePort: '',
    destinationPort: '',
    departureTime: '',
    arrivalTime: '',
    date: '',
    seatsAvailable: '0',
    totalSeats: '0',
    basePrice: '0',
  });
  const [cabinForm, setCabinForm] = useState({
    shipId: '',
    type: 'single-riverside' as CabinType,
    number: '',
    capacity: '1',
    basePrice: '',
  });

  useEffect(() => {
    Promise.all([fetchShips(), fetchRoutes(), fetchCabins(), fetchBookings()]).catch(
      (error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Failed to load dashboard data');
      },
    );
  }, [fetchBookings, fetchCabins, fetchRoutes, fetchShips]);

  const ownerShips = useMemo(() => {
    if (!user) {
      return [];
    }
    return ships.filter((ship) => ship.ownerId === user.id);
  }, [ships, user]);

  const ownerShipIds = useMemo(
    () => new Set(ownerShips.map((ship) => ship.id)),
    [ownerShips],
  );

  const ownerRoutes = useMemo(
    () => routes.filter((route) => ownerShipIds.has(route.shipId)),
    [ownerShipIds, routes],
  );

  const ownerRouteIds = useMemo(
    () => new Set(ownerRoutes.map((route) => route.id)),
    [ownerRoutes],
  );

  const ownerCabins = useMemo(
    () => cabins.filter((cabin) => ownerShipIds.has(cabin.shipId)),
    [cabins, ownerShipIds],
  );

  const ownerBookings = useMemo(
    () => bookings.filter((booking) => ownerRouteIds.has(booking.routeId)),
    [bookings, ownerRouteIds],
  );

  if (!user || user.role !== 'shipowner') {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <Card className='p-8 text-center max-w-md'>
          <h1 className='text-2xl font-bold text-gray-900'>Shipowner Access Only</h1>
          <p className='mt-3 text-gray-600'>
            Please log in with a shipowner account to manage ships and routes.
          </p>
          <Link href='/login' className='inline-block mt-6'>
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isLoading = shipsLoading || routesLoading || cabinsLoading || bookingsLoading;
  const totalRevenue = ownerBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

  const handleAddShip = async () => {
    if (!shipForm.name.trim() || !shipForm.operator.trim()) {
      toast.error('Ship name and operator are required');
      return;
    }

    try {
      await addShip({
        ...shipForm,
        image:
          shipForm.image.trim() ||
          'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=1200',
      });
      toast.success('Ship created successfully');
      setShipForm({ name: '', operator: '', image: '', description: '' });
      setShowShipModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create ship');
    }
  };

  const handleAddRoute = async () => {
    if (
      !routeForm.shipId ||
      !routeForm.departurePort.trim() ||
      !routeForm.destinationPort.trim() ||
      !routeForm.departureTime ||
      !routeForm.arrivalTime ||
      !routeForm.date
    ) {
      toast.error('Complete all route fields before saving');
      return;
    }

    try {
      await addRoute({
        shipId: routeForm.shipId,
        departurePort: routeForm.departurePort,
        destinationPort: routeForm.destinationPort,
        departureTime: routeForm.departureTime,
        arrivalTime: routeForm.arrivalTime,
        duration: computeDurationHours(routeForm.departureTime, routeForm.arrivalTime),
        date: routeForm.date,
        seatsAvailable: Number(routeForm.seatsAvailable) || 0,
        totalSeats: Number(routeForm.totalSeats) || 0,
        basePrice: Number(routeForm.basePrice) || 0,
        status: 'active',
      });
      toast.success('Route created successfully');
      setRouteForm({
        shipId: '',
        departurePort: '',
        destinationPort: '',
        departureTime: '',
        arrivalTime: '',
        date: '',
        seatsAvailable: '0',
        totalSeats: '0',
        basePrice: '0',
      });
      setShowRouteModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create route');
    }
  };

  const handleAddCabin = async () => {
    if (!cabinForm.shipId || !cabinForm.number.trim() || !cabinForm.basePrice) {
      toast.error('Ship, cabin number, and base price are required');
      return;
    }

    try {
      await addCabin({
        shipId: cabinForm.shipId,
        type: cabinForm.type,
        number: cabinForm.number,
        capacity: Number(cabinForm.capacity) || 1,
        basePrice: Number(cabinForm.basePrice),
        amenities: [],
      });
      toast.success('Cabin added successfully');
      setCabinForm({
        shipId: cabinForm.shipId,
        type: 'single-riverside',
        number: '',
        capacity: '1',
        basePrice: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add cabin');
    }
  };

  const handleDeleteShip = async (shipId: string) => {
    if (!window.confirm('Delete this ship? Make sure it has no routes or cabins first.')) {
      return;
    }
    try {
      await removeShip(shipId);
      toast.success('Ship deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete ship');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!window.confirm('Delete this route? Routes with bookings cannot be removed.')) {
      return;
    }
    try {
      await removeRoute(routeId);
      toast.success('Route deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete route');
    }
  };

  const handleDeleteCabin = async (cabinId: string) => {
    if (!window.confirm('Delete this cabin? Booked cabins cannot be removed.')) {
      return;
    }
    try {
      await removeCabin(cabinId);
      toast.success('Cabin deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete cabin');
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'confirmed');
      toast.success('Booking confirmed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm booking');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-blue-600 text-white py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold'>Ship Management Dashboard</h1>
          <p className='text-blue-100 mt-2'>Manage your fleet, routes, cabins, and bookings.</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          {[
            { label: 'Ships', value: ownerShips.length },
            { label: 'Routes', value: ownerRoutes.length },
            { label: 'Bookings', value: ownerBookings.length },
            { label: 'Revenue', value: formatCurrency(totalRevenue) },
          ].map((stat) => (
            <Card key={stat.label} className='p-6'>
              <p className='text-sm text-gray-500'>{stat.label}</p>
              <p className='text-3xl font-bold mt-2'>{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className='flex flex-wrap gap-3 mb-6 border-b pb-4'>
          {(['ships', 'routes', 'cabins', 'bookings'] as OwnerTab[]).map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Card className='p-12 text-center'>
            <p className='text-gray-500'>Loading dashboard data...</p>
          </Card>
        ) : null}

        {!isLoading && activeTab === 'ships' && (
          <div>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold'>My Ships</h2>
              <Button onClick={() => setShowShipModal(true)}>
                <Plus size={18} />
                Add Ship
              </Button>
            </div>

            {ownerShips.length === 0 ? (
              <Card className='p-12 text-center'>
                <p className='text-gray-500 mb-4'>You have not added any ships yet.</p>
                <Button onClick={() => setShowShipModal(true)}>Add Your First Ship</Button>
              </Card>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                {ownerShips.map((ship) => (
                  <Card key={ship.id} className='overflow-hidden'>
                    <div className='h-40 bg-slate-200'>
                      {ship.image ? (
                        <img src={ship.image} alt={ship.name} className='w-full h-full object-cover' />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-slate-500'>
                          No image
                        </div>
                      )}
                    </div>
                    <div className='p-5'>
                      <h3 className='text-lg font-bold'>{ship.name}</h3>
                      <p className='text-sm text-gray-600 mt-1'>{ship.operator}</p>
                      <p className='text-sm text-gray-600 mt-3 line-clamp-3'>{ship.description}</p>
                      <div className='flex justify-between items-center mt-4 text-sm'>
                        <span className='font-semibold'>Rating {ship.rating.toFixed(1)}</span>
                        <span className='text-gray-500'>{ship.reviews} reviews</span>
                      </div>
                      <Button
                        variant='danger'
                        fullWidth
                        className='mt-4'
                        onClick={() => void handleDeleteShip(ship.id)}
                      >
                        <Trash2 size={16} />
                        Delete Ship
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && activeTab === 'routes' && (
          <div>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold'>Routes</h2>
              <Button onClick={() => setShowRouteModal(true)} disabled={ownerShips.length === 0}>
                <Plus size={18} />
                Add Route
              </Button>
            </div>

            {ownerRoutes.length === 0 ? (
              <Card className='p-12 text-center'>
                <p className='text-gray-500'>
                  {ownerShips.length === 0
                    ? 'Add a ship before creating routes.'
                    : 'No routes created yet.'}
                </p>
              </Card>
            ) : (
              <div className='space-y-4'>
                {ownerRoutes.map((route) => {
                  const ship = ownerShips.find((item) => item.id === route.shipId);
                  return (
                    <Card key={route.id} className='p-6'>
                      <div className='flex flex-col md:flex-row md:items-start justify-between gap-4'>
                        <div>
                          <h3 className='text-lg font-bold'>{ship?.name || 'Unknown ship'}</h3>
                          <p className='text-gray-600 mt-1'>
                            {route.departurePort} to {route.destinationPort}
                          </p>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm'>
                            <div>
                              <p className='text-gray-500'>Departure</p>
                              <p className='font-semibold'>{route.departureTime}</p>
                            </div>
                            <div>
                              <p className='text-gray-500'>Arrival</p>
                              <p className='font-semibold'>{route.arrivalTime}</p>
                            </div>
                            <div>
                              <p className='text-gray-500'>Date</p>
                              <p className='font-semibold'>{formatDate(route.date)}</p>
                            </div>
                            <div>
                              <p className='text-gray-500'>Price</p>
                              <p className='font-semibold text-blue-600'>
                                {formatCurrency(route.basePrice)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-3'>
                          <Badge variant={route.status === 'active' ? 'success' : 'warning'}>
                            {route.status}
                          </Badge>
                          <Button
                            variant='danger'
                            onClick={() => void handleDeleteRoute(route.id)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isLoading && activeTab === 'cabins' && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <Card className='p-6 xl:col-span-1'>
              <h2 className='text-xl font-bold mb-4'>Add Cabin</h2>
              {ownerShips.length === 0 ? (
                <p className='text-gray-500'>Add a ship before creating cabins.</p>
              ) : (
                <div className='space-y-4'>
                  <Select
                    label='Ship'
                    value={cabinForm.shipId}
                    onChange={(event) =>
                      setCabinForm((current) => ({ ...current, shipId: event.target.value }))
                    }
                    options={ownerShips.map((ship) => ({ value: ship.id, label: ship.name }))}
                  />
                  <Select
                    label='Cabin Type'
                    value={cabinForm.type}
                    onChange={(event) =>
                      setCabinForm((current) => ({
                        ...current,
                        type: event.target.value as CabinType,
                      }))
                    }
                    options={Object.entries(CABIN_TYPES).map(([value, cabinType]) => ({
                      value,
                      label: cabinType.name,
                    }))}
                  />
                  <Input
                    label='Cabin Number'
                    value={cabinForm.number}
                    onChange={(event) =>
                      setCabinForm((current) => ({ ...current, number: event.target.value }))
                    }
                  />
                  <Input
                    label='Capacity'
                    type='number'
                    value={cabinForm.capacity}
                    onChange={(event) =>
                      setCabinForm((current) => ({ ...current, capacity: event.target.value }))
                    }
                  />
                  <Input
                    label='Base Price'
                    type='number'
                    value={cabinForm.basePrice}
                    onChange={(event) =>
                      setCabinForm((current) => ({ ...current, basePrice: event.target.value }))
                    }
                  />
                  <Button fullWidth onClick={() => void handleAddCabin()}>
                    Add Cabin
                  </Button>
                </div>
              )}
            </Card>

            <div className='xl:col-span-2 space-y-4'>
              {ownerCabins.length === 0 ? (
                <Card className='p-12 text-center'>
                  <p className='text-gray-500'>No cabins configured yet.</p>
                </Card>
              ) : (
                ownerCabins.map((cabin) => {
                  const ship = ownerShips.find((item) => item.id === cabin.shipId);
                  return (
                    <Card key={cabin.id} className='p-5 flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div>
                        <h3 className='font-bold'>
                          {cabin.number} on {ship?.name || 'Unknown ship'}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          {CABIN_TYPES[cabin.type].name} and {formatCurrency(cabin.basePrice)}
                        </p>
                      </div>
                      <Button variant='danger' onClick={() => void handleDeleteCabin(cabin.id)}>
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'bookings' && (
          <div>
            <h2 className='text-2xl font-bold mb-6'>Bookings</h2>
            {ownerBookings.length === 0 ? (
              <Card className='p-12 text-center'>
                <p className='text-gray-500'>No bookings have been placed on your routes yet.</p>
              </Card>
            ) : (
              <div className='space-y-4'>
                {ownerBookings.map((booking) => {
                  const route = ownerRoutes.find((item) => item.id === booking.routeId);
                  return (
                    <Card key={booking.id} className='p-6'>
                      <div className='flex flex-col md:flex-row md:items-start justify-between gap-4'>
                        <div>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className='text-lg font-bold'>Booking {booking.id.slice(0, 8)}</h3>
                            <Badge variant={getBookingVariant(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-600'>
                            {route
                              ? `${route.departurePort} to ${route.destinationPort}`
                              : 'Unknown route'}
                          </p>
                          <p className='text-sm text-gray-600 mt-1'>
                            {booking.passengers.length} passengers and {booking.items.length} cabins
                          </p>
                          <p className='text-lg font-bold text-blue-600 mt-3'>
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>

                        {booking.status === 'pending' ? (
                          <Button
                            variant='success'
                            onClick={() => void handleConfirmBooking(booking.id)}
                          >
                            <CheckCircle2 size={16} />
                            Confirm
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showShipModal} onClose={() => setShowShipModal(false)} title='Add Ship'>
        <div className='space-y-4'>
          <Input
            label='Ship Name'
            value={shipForm.name}
            onChange={(event) =>
              setShipForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <Input
            label='Operator'
            value={shipForm.operator}
            onChange={(event) =>
              setShipForm((current) => ({ ...current, operator: event.target.value }))
            }
          />
          <Input
            label='Image URL'
            value={shipForm.image}
            onChange={(event) =>
              setShipForm((current) => ({ ...current, image: event.target.value }))
            }
          />
          <Input
            label='Description'
            value={shipForm.description}
            onChange={(event) =>
              setShipForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <div className='flex gap-2'>
            <Button variant='secondary' fullWidth onClick={() => setShowShipModal(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={() => void handleAddShip()}>
              Save Ship
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRouteModal} onClose={() => setShowRouteModal(false)} title='Add Route'>
        <div className='space-y-4'>
          <Select
            label='Ship'
            value={routeForm.shipId}
            onChange={(event) =>
              setRouteForm((current) => ({ ...current, shipId: event.target.value }))
            }
            options={ownerShips.map((ship) => ({ value: ship.id, label: ship.name }))}
          />
          <Input
            label='Departure Port'
            value={routeForm.departurePort}
            onChange={(event) =>
              setRouteForm((current) => ({ ...current, departurePort: event.target.value }))
            }
          />
          <Input
            label='Destination Port'
            value={routeForm.destinationPort}
            onChange={(event) =>
              setRouteForm((current) => ({ ...current, destinationPort: event.target.value }))
            }
          />
          <div className='grid grid-cols-2 gap-4'>
            <Input
              type='time'
              label='Departure Time'
              value={routeForm.departureTime}
              onChange={(event) =>
                setRouteForm((current) => ({ ...current, departureTime: event.target.value }))
              }
            />
            <Input
              type='time'
              label='Arrival Time'
              value={routeForm.arrivalTime}
              onChange={(event) =>
                setRouteForm((current) => ({ ...current, arrivalTime: event.target.value }))
              }
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              type='date'
              label='Date'
              value={routeForm.date}
              onChange={(event) =>
                setRouteForm((current) => ({ ...current, date: event.target.value }))
              }
            />
            <Input
              type='number'
              label='Base Price'
              value={routeForm.basePrice}
              onChange={(event) =>
                setRouteForm((current) => ({ ...current, basePrice: event.target.value }))
              }
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              type='number'
              label='Seats Available'
              value={routeForm.seatsAvailable}
              onChange={(event) =>
                setRouteForm((current) => ({ ...current, seatsAvailable: event.target.value }))
              }
            />
            <Input
              type='number'
              label='Total Seats'
              value={routeForm.totalSeats}
              onChange={(event) =>
                setRouteForm((current) => ({ ...current, totalSeats: event.target.value }))
              }
            />
          </div>
          <div className='flex gap-2'>
            <Button variant='secondary' fullWidth onClick={() => setShowRouteModal(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={() => void handleAddRoute()}>
              Save Route
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
