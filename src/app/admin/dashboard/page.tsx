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
import { useUserStore } from '@/store/userStore';
import { Booking, CabinType } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { CABIN_TYPES } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';

type AdminTab = 'overview' | 'ships' | 'routes' | 'cabins' | 'bookings' | 'users';

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

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { ships, loading: shipsLoading, fetchShips, addShip, removeShip } = useShipStore();
  const { routes, loading: routesLoading, fetchRoutes, addRoute, removeRoute } = useRouteStore();
  const { cabins, loading: cabinsLoading, fetchCabins, addCabin, removeCabin } = useCabinStore();
  const {
    bookings,
    loading: bookingsLoading,
    fetchBookings,
    updateBookingStatus,
    deleteBooking,
  } = useBookingStore();
  const { users, loading: usersLoading, fetchUsers } = useUserStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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
    Promise.all([
      fetchShips(),
      fetchRoutes(),
      fetchCabins(),
      fetchBookings(),
      fetchUsers(),
    ]).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load admin data');
    });
  }, [fetchBookings, fetchCabins, fetchRoutes, fetchShips, fetchUsers]);

  const isLoading =
    shipsLoading || routesLoading || cabinsLoading || bookingsLoading || usersLoading;

  const confirmedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'confirmed').length,
    [bookings],
  );

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    [bookings],
  );

  const usersById = useMemo(() => {
    return new Map(users.map((record) => [record.id, record]));
  }, [users]);

  if (!user || user.role !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <Card className='p-8 text-center max-w-md'>
          <h1 className='text-2xl font-bold text-gray-900'>Admin Access Only</h1>
          <p className='mt-3 text-gray-600'>Please log in with an administrator account.</p>
          <Link href='/login' className='inline-block mt-6'>
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
    if (!window.confirm('Delete this ship? It must not have routes or cabins attached.')) {
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

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'confirmed');
      toast.success('Booking approved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Delete this booking permanently?')) {
      return;
    }
    try {
      await deleteBooking(bookingId);
      toast.success('Booking deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete booking');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-gradient-to-r from-slate-900 to-blue-700 text-white py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold'>Admin Dashboard</h1>
          <p className='text-slate-200 mt-2'>Monitor the platform and manage live data.</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='flex flex-wrap gap-3 mb-6'>
          {(['overview', 'ships', 'routes', 'cabins', 'bookings', 'users'] as AdminTab[]).map(
            (tab) => (
              <button
                key={tab}
                type='button'
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </div>

        {isLoading ? (
          <Card className='p-12 text-center'>
            <p className='text-gray-500'>Loading admin data...</p>
          </Card>
        ) : null}

        {!isLoading && activeTab === 'overview' && (
          <div className='space-y-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
              {[
                { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
                { label: 'Ships', value: ships.length },
                { label: 'Bookings', value: bookings.length },
                { label: 'Confirmed', value: confirmedBookings },
              ].map((stat) => (
                <Card key={stat.label} className='p-6'>
                  <p className='text-sm text-gray-500'>{stat.label}</p>
                  <p className='text-3xl font-bold mt-2'>{stat.value}</p>
                </Card>
              ))}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              <Card className='p-6'>
                <h2 className='text-xl font-bold mb-4'>Recent Bookings</h2>
                <div className='space-y-3'>
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className='rounded-lg bg-gray-50 p-4'>
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <p className='font-semibold'>Booking {booking.id.slice(0, 8)}</p>
                          <p className='text-sm text-gray-600'>
                            {booking.passengers.length} passengers and {booking.items.length} cabins
                          </p>
                        </div>
                        <Badge variant={getBookingVariant(booking.status)}>{booking.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className='p-6'>
                <h2 className='text-xl font-bold mb-4'>Newest Users</h2>
                <div className='space-y-3'>
                  {users.slice(0, 5).map((record) => (
                    <div key={record.id} className='rounded-lg bg-gray-50 p-4'>
                      <p className='font-semibold'>{record.name}</p>
                      <p className='text-sm text-gray-600'>{record.email}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {record.role} joined {formatDate(record.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'ships' && (
          <div>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold'>Ships</h2>
              <Button onClick={() => setShowShipModal(true)}>
                <Plus size={18} />
                Add Ship
              </Button>
            </div>

            <div className='space-y-4'>
              {ships.map((ship) => {
                const owner = usersById.get(ship.ownerId);
                return (
                  <Card key={ship.id} className='p-6'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div>
                        <h3 className='text-lg font-bold'>{ship.name}</h3>
                        <p className='text-sm text-gray-600'>{ship.operator}</p>
                        <p className='text-sm text-gray-500 mt-2'>
                          Owner: {owner?.name || `User #${ship.ownerId}`}
                        </p>
                      </div>
                      <Button variant='danger' onClick={() => void handleDeleteShip(ship.id)}>
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'routes' && (
          <div>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold'>Routes</h2>
              <Button onClick={() => setShowRouteModal(true)} disabled={ships.length === 0}>
                <Plus size={18} />
                Add Route
              </Button>
            </div>

            <div className='space-y-4'>
              {routes.map((route) => {
                const ship = ships.find((item) => item.id === route.shipId);
                return (
                  <Card key={route.id} className='p-6'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div>
                        <h3 className='text-lg font-bold'>{ship?.name || 'Unknown ship'}</h3>
                        <p className='text-sm text-gray-600'>
                          {route.departurePort} to {route.destinationPort}
                        </p>
                        <p className='text-sm text-gray-500 mt-2'>
                          {formatDate(route.date)} and {formatCurrency(route.basePrice)}
                        </p>
                      </div>
                      <Button variant='danger' onClick={() => void handleDeleteRoute(route.id)}>
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'cabins' && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <Card className='p-6 xl:col-span-1'>
              <h2 className='text-xl font-bold mb-4'>Add Cabin</h2>
              <div className='space-y-4'>
                <Select
                  label='Ship'
                  value={cabinForm.shipId}
                  onChange={(event) =>
                    setCabinForm((current) => ({ ...current, shipId: event.target.value }))
                  }
                  options={ships.map((ship) => ({ value: ship.id, label: ship.name }))}
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
                  type='number'
                  label='Capacity'
                  value={cabinForm.capacity}
                  onChange={(event) =>
                    setCabinForm((current) => ({ ...current, capacity: event.target.value }))
                  }
                />
                <Input
                  type='number'
                  label='Base Price'
                  value={cabinForm.basePrice}
                  onChange={(event) =>
                    setCabinForm((current) => ({ ...current, basePrice: event.target.value }))
                  }
                />
                <Button fullWidth onClick={() => void handleAddCabin()}>
                  Add Cabin
                </Button>
              </div>
            </Card>

            <div className='xl:col-span-2 space-y-4'>
              {cabins.map((cabin) => {
                const ship = ships.find((item) => item.id === cabin.shipId);
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
              })}
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'bookings' && (
          <div>
            <h2 className='text-2xl font-bold mb-6'>Bookings</h2>
            <div className='space-y-4'>
              {bookings.map((booking) => {
                const route = routes.find((item) => item.id === booking.routeId);
                return (
                  <Card key={booking.id} className='p-6'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
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
                        <p className='text-sm text-gray-500 mt-2'>
                          {booking.passengers.length} passengers and {booking.items.length} cabins
                        </p>
                        <p className='text-lg font-bold text-blue-600 mt-3'>
                          {formatCurrency(booking.totalPrice)}
                        </p>
                      </div>

                      <div className='flex gap-2'>
                        {booking.status === 'pending' ? (
                          <Button
                            variant='success'
                            onClick={() => void handleApproveBooking(booking.id)}
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </Button>
                        ) : null}
                        <Button
                          variant='danger'
                          onClick={() => void handleDeleteBooking(booking.id)}
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
          </div>
        )}

        {!isLoading && activeTab === 'users' && (
          <div>
            <h2 className='text-2xl font-bold mb-6'>Users</h2>
            <div className='space-y-4'>
              {users.map((record) => (
                <Card key={record.id} className='p-6'>
                  <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                      <h3 className='text-lg font-bold'>{record.name}</h3>
                      <p className='text-sm text-gray-600'>{record.email}</p>
                    </div>
                    <div className='text-sm text-gray-500'>
                      <p className='font-semibold text-gray-700'>{record.role}</p>
                      <p>Joined {formatDate(record.createdAt)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
            options={ships.map((ship) => ({ value: ship.id, label: ship.name }))}
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
