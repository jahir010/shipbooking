'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { useCabinStore } from '@/store/cabinStore';
import { useRouteStore } from '@/store/routeStore';
import { useShipStore } from '@/store/shipStore';
import { CabinType, Passenger } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CABIN_TYPES } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  cabinId: string;
  cabinType: CabinType;
  cabinNumber: string;
  pricePerUnit: number;
}

const emptyPassenger = (): Passenger => ({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  age: 0,
  documentType: 'Passport',
  documentNumber: '',
  gender: 'male',
});

export default function BookingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cabins, loading: cabinsLoading, fetchCabins } = useCabinStore();
  const { ships, loading: shipsLoading, fetchShips } = useShipStore();
  const { routes, loading: routesLoading, fetchRoutes } = useRouteStore();
  const { createBooking } = useBookingStore();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedRouteId = localStorage.getItem('selectedRoute');
    if (!storedRouteId) {
      router.replace('/customer/dashboard');
      return;
    }
    setSelectedRouteId(storedRouteId);

    Promise.all([fetchCabins(), fetchShips(), fetchRoutes()]).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load booking data');
    });
  }, [fetchCabins, fetchRoutes, fetchShips, router]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const selectedShip = useMemo(
    () => ships.find((ship) => ship.id === selectedRoute?.shipId) ?? null,
    [ships, selectedRoute],
  );

  const shipCabins = useMemo(
    () => cabins.filter((cabin) => cabin.shipId === selectedShip?.id),
    [cabins, selectedShip],
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.pricePerUnit, 0),
    [cart],
  );

  const floors = useMemo(() => {
    return shipCabins.reduce<Record<string, typeof shipCabins>>((accumulator, cabin) => {
      const digits = cabin.number.match(/\d+/);
      const floorNumber = digits ? digits[0][0] : null;
      const label =
        floorNumber === '1'
          ? '1st Floor'
          : floorNumber === '2'
          ? '2nd Floor'
          : floorNumber
          ? `${floorNumber}th Floor`
          : 'Other Floor';

      if (!accumulator[label]) {
        accumulator[label] = [];
      }
      accumulator[label].push(cabin);
      return accumulator;
    }, {});
  }, [shipCabins]);

  const sortedFloorEntries = useMemo(() => {
    return Object.entries(floors).sort(([left], [right]) => {
      const leftNumber = Number.parseInt(left, 10) || 0;
      const rightNumber = Number.parseInt(right, 10) || 0;
      return leftNumber - rightNumber;
    });
  }, [floors]);

  if (!user || user.role !== 'customer') {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <Card className='p-8 text-center max-w-md'>
          <h1 className='text-2xl font-bold text-gray-900'>Customer Access Only</h1>
          <p className='mt-3 text-gray-600'>Please log in with a customer account to book cabins.</p>
          <Link href='/login' className='inline-block mt-6'>
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (cabinsLoading || shipsLoading || routesLoading || !selectedRouteId) {
    return <div className='p-6 text-center text-gray-500'>Loading booking details...</div>;
  }

  if (!selectedRoute || !selectedShip) {
    return (
      <div className='p-6'>
        <Card className='p-8 text-center'>
          <p className='text-gray-600'>The selected route could not be found.</p>
          <Link href='/customer/dashboard' className='inline-block mt-4'>
            <Button>Back to Routes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const updatePassenger = (
    index: number,
    field: keyof Passenger,
    value: Passenger[keyof Passenger],
  ) => {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
  };

  const handleToggleCabin = (cabinId: string) => {
    const existingIndex = cart.findIndex((item) => item.cabinId === cabinId);
    if (existingIndex >= 0) {
      setCart((current) => current.filter((item) => item.cabinId !== cabinId));
      setPassengers((current) => current.filter((_, index) => index !== existingIndex));
      return;
    }

    const cabin = shipCabins.find((item) => item.id === cabinId);
    if (!cabin) {
      return;
    }

    setCart((current) => [
      ...current,
      {
        cabinId: cabin.id,
        cabinType: cabin.type,
        cabinNumber: cabin.number,
        pricePerUnit: cabin.basePrice,
      },
    ]);
    setPassengers((current) => [...current, emptyPassenger()]);
  };

  const handleCompleteBooking = async () => {
    if (cart.length === 0) {
      toast.error('Select at least one cabin to continue');
      return;
    }

    const missingPassenger = passengers.some(
      (passenger) =>
        !passenger.firstName.trim() ||
        !passenger.lastName.trim() ||
        !passenger.email.trim() ||
        !passenger.phone.trim(),
    );

    if (missingPassenger) {
      toast.error('Complete every passenger form before submitting');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        userId: user.id,
        routeId: selectedRoute.id,
        items: cart.map((item) => ({
          cabinId: item.cabinId,
          cabinType: item.cabinType,
          cabinNumber: item.cabinNumber,
          quantity: 1,
          pricePerUnit: item.pricePerUnit,
        })),
        totalPrice: Number((totalPrice * 1.05).toFixed(2)),
        status: 'pending',
        passengers: passengers.map((passenger) => ({
          ...passenger,
          age: Number(passenger.age) || 0,
        })),
      });
      localStorage.removeItem('selectedRoute');
      toast.success('Booking created successfully');
      router.push('/customer/bookings');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-blue-600 text-white py-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold'>Book Your Journey</h1>
          <p className='text-blue-100 mt-2'>
            {selectedShip.name} from {selectedRoute.departurePort} to {selectedRoute.destinationPort}
          </p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-6'>
            <Card className='p-6'>
              <h2 className='text-xl font-bold mb-4'>Route Summary</h2>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-gray-500'>Ship</p>
                  <p className='font-semibold'>{selectedShip.name}</p>
                </div>
                <div>
                  <p className='text-gray-500'>Operator</p>
                  <p className='font-semibold'>{selectedShip.operator}</p>
                </div>
                <div>
                  <p className='text-gray-500'>Departure</p>
                  <p className='font-semibold'>
                    {selectedRoute.departurePort} at {selectedRoute.departureTime}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500'>Arrival</p>
                  <p className='font-semibold'>
                    {selectedRoute.destinationPort} at {selectedRoute.arrivalTime}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
                <div>
                  <h2 className='text-xl font-bold'>Cabin Selection</h2>
                  <p className='text-sm text-gray-500'>
                    Select one or more cabins for this route.
                  </p>
                </div>
                <div className='flex gap-2 text-xs'>
                  <span className='rounded-full bg-emerald-100 px-3 py-1 text-emerald-800'>Selected</span>
                  <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-800'>Available</span>
                </div>
              </div>

              {shipCabins.length === 0 ? (
                <div className='rounded-lg border border-dashed border-slate-300 p-10 text-center text-gray-500'>
                  No cabins are configured for this ship yet.
                </div>
              ) : (
                sortedFloorEntries.map(([floorLabel, floorCabins]) => (
                  <div key={floorLabel} className='mb-8'>
                    <div className='mb-4 rounded-lg bg-slate-100 px-5 py-4'>
                      <p className='text-xs uppercase tracking-wide text-slate-500'>{floorLabel}</p>
                      <p className='text-sm text-slate-600'>{floorCabins.length} cabins</p>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                      {floorCabins.map((cabin) => {
                        const selected = cart.some((item) => item.cabinId === cabin.id);
                        return (
                          <button
                            key={cabin.id}
                            type='button'
                            onClick={() => handleToggleCabin(cabin.id)}
                            className={`rounded-2xl border p-5 text-left transition ${
                              selected
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <h3 className='text-2xl font-semibold text-slate-900'>{cabin.number}</h3>
                                <p className='mt-2 text-sm font-semibold text-slate-900'>
                                  {CABIN_TYPES[cabin.type].name}
                                </p>
                              </div>
                              <Badge variant={selected ? 'success' : 'primary'}>
                                {selected ? 'Selected' : 'Available'}
                              </Badge>
                            </div>
                            <p className='mt-4 text-lg font-semibold text-slate-900'>
                              {formatCurrency(cabin.basePrice)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </Card>

            {passengers.length > 0 && (
              <Card className='p-6'>
                <h2 className='text-xl font-bold mb-6'>Passenger Details</h2>
                <div className='space-y-6'>
                  {passengers.map((passenger, index) => (
                    <div key={`${cart[index]?.cabinId ?? index}`} className='border rounded-lg p-4'>
                      <h3 className='font-semibold mb-4'>Passenger {index + 1}</h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Input
                          label='First Name'
                          value={passenger.firstName}
                          onChange={(event) =>
                            updatePassenger(index, 'firstName', event.target.value)
                          }
                        />
                        <Input
                          label='Last Name'
                          value={passenger.lastName}
                          onChange={(event) =>
                            updatePassenger(index, 'lastName', event.target.value)
                          }
                        />
                        <Input
                          type='email'
                          label='Email'
                          value={passenger.email}
                          onChange={(event) => updatePassenger(index, 'email', event.target.value)}
                        />
                        <Input
                          label='Phone'
                          value={passenger.phone}
                          onChange={(event) => updatePassenger(index, 'phone', event.target.value)}
                        />
                        <Input
                          type='number'
                          label='Age'
                          value={passenger.age || ''}
                          onChange={(event) =>
                            updatePassenger(index, 'age', Number(event.target.value))
                          }
                        />
                        <Select
                          label='Gender'
                          value={passenger.gender}
                          onChange={(event) =>
                            updatePassenger(index, 'gender', event.target.value as Passenger['gender'])
                          }
                          options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                          ]}
                        />
                        <Input
                          label='Document Type'
                          value={passenger.documentType}
                          onChange={(event) =>
                            updatePassenger(index, 'documentType', event.target.value)
                          }
                        />
                        <Input
                          label='Document Number'
                          value={passenger.documentNumber}
                          onChange={(event) =>
                            updatePassenger(index, 'documentNumber', event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div>
            <Card className='p-6 sticky top-24'>
              <h2 className='text-xl font-bold mb-6'>Booking Summary</h2>

              <div className='space-y-3 mb-6 max-h-96 overflow-y-auto'>
                {cart.map((item, index) => (
                  <div key={item.cabinId} className='p-3 bg-gray-50 rounded-lg'>
                    <div className='flex justify-between items-start mb-2'>
                      <div>
                        <p className='font-semibold text-sm'>{item.cabinNumber}</p>
                        <p className='text-xs text-gray-600'>{CABIN_TYPES[item.cabinType].name}</p>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleToggleCabin(item.cabinId)}
                        className='text-red-500 hover:text-red-700'
                        aria-label={`Remove cabin ${item.cabinNumber}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className='text-blue-600 font-bold text-sm'>
                      {formatCurrency(item.pricePerUnit)}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>Passenger {index + 1}</p>
                  </div>
                ))}
              </div>

              {cart.length === 0 && (
                <p className='text-gray-500 text-sm text-center py-4'>No cabins selected yet.</p>
              )}

              <div className='border-t pt-4 space-y-2 mb-6'>
                <div className='flex justify-between'>
                  <p>Subtotal</p>
                  <p className='font-semibold'>{formatCurrency(totalPrice)}</p>
                </div>
                <div className='flex justify-between'>
                  <p>Taxes and Fees</p>
                  <p className='font-semibold'>{formatCurrency(totalPrice * 0.05)}</p>
                </div>
                <div className='border-t pt-2 flex justify-between text-lg font-bold'>
                  <p>Total</p>
                  <p className='text-blue-600'>{formatCurrency(totalPrice * 1.05)}</p>
                </div>
              </div>

              <Button
                fullWidth
                onClick={handleCompleteBooking}
                disabled={cart.length === 0 || submitting}
              >
                {submitting ? 'Submitting...' : 'Complete Booking'}
              </Button>

              <p className='text-xs text-gray-500 text-center mt-4'>
                By booking, you agree to the platform terms and conditions.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
