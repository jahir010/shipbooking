'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Ticket, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { createCabinHold, releaseCabinHold } from '@/lib/api';
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
import PageHero from '@/components/layout/PageHero';
import { CABIN_TYPES } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  cabinId: string;
  cabinType: CabinType;
  cabinNumber: string;
  pricePerUnit: number;
  expiresAt?: string;
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
  }, [router]);

  useEffect(() => {
    if (!selectedRouteId) {
      return;
    }

    Promise.all([
      fetchShips(),
      fetchRoutes(),
      fetchCabins({ routeId: selectedRouteId, availableOnly: true }),
    ]).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load booking data');
    });
  }, [fetchCabins, fetchRoutes, fetchShips, selectedRouteId]);

  useEffect(() => {
    return () => {
      if (!selectedRouteId || cart.length === 0) {
        return;
      }
      for (const item of cart) {
        void releaseCabinHold(selectedRouteId, item.cabinId);
      }
    };
  }, [cart, selectedRouteId]);

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

  const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + item.pricePerUnit, 0), [cart]);

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
      <div className='page-shell min-h-screen px-4 py-10 lg:px-8'>
        <div className='mx-auto max-w-xl'>
          <Card className='p-10 text-center'>
            <h1 className='font-display text-4xl font-semibold text-[#0f3b68]'>Customer Access Only</h1>
            <p className='mt-4 text-base leading-7 text-slate-600'>
              Please log in with a customer account to book cabins.
            </p>
            <Link href='/login' className='mt-6 inline-block'>
              <Button>Go to Login</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (cabinsLoading || shipsLoading || routesLoading || !selectedRouteId) {
    return <div className='page-shell min-h-screen px-4 py-10 text-center text-slate-500'>Loading booking details...</div>;
  }

  if (!selectedRoute || !selectedShip) {
    return (
      <div className='page-shell min-h-screen px-4 py-10 lg:px-8'>
        <div className='mx-auto max-w-2xl'>
          <Card className='p-10 text-center'>
            <p className='text-lg leading-7 text-slate-600'>
              The selected route is no longer available for booking. Please choose another upcoming trip.
            </p>
            <Link href='/customer/dashboard' className='mt-5 inline-block'>
              <Button>Back to Routes</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const updatePassenger = (index: number, field: keyof Passenger, value: Passenger[keyof Passenger]) => {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
  };

  const handleToggleCabin = async (cabinId: string) => {
    try {
      const existingIndex = cart.findIndex((item) => item.cabinId === cabinId);
      if (existingIndex >= 0) {
        if (selectedRouteId) {
          await releaseCabinHold(selectedRouteId, cabinId);
        }
        setCart((current) => current.filter((item) => item.cabinId !== cabinId));
        setPassengers((current) => current.filter((_, index) => index !== existingIndex));
        return;
      }

      const cabin = shipCabins.find((item) => item.id === cabinId);
      if (!cabin || !selectedRouteId) {
        return;
      }

      const hold = await createCabinHold(selectedRouteId, cabinId);

      setCart((current) => [
        ...current,
        {
          cabinId: cabin.id,
          cabinType: cabin.type,
          cabinNumber: cabin.number,
          pricePerUnit: cabin.basePrice,
          expiresAt: hold.expires_at,
        },
      ]);
      setPassengers((current) => [...current, emptyPassenger()]);
      toast.success(`Cabin ${cabin.number} is held for 5 minutes`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to hold this cabin right now');
      if (selectedRouteId) {
        void fetchCabins({ routeId: selectedRouteId, availableOnly: true });
      }
    }
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
      const result = await createBooking({
        userId: user.id,
        routeId: selectedRoute.id,
        items: cart.map((item) => ({
          cabinId: item.cabinId,
          cabinType: item.cabinType,
          cabinNumber: item.cabinNumber,
          quantity: 1,
          pricePerUnit: item.pricePerUnit,
        })),
        totalPrice: totalPrice,
        status: 'pending',
        passengers: passengers.map((passenger) => ({
          ...passenger,
          age: Number(passenger.age) || 0,
        })),
        paymentMethod: 'sslcommerz',
      });
      if (result.paymentUrl) {
        localStorage.removeItem('selectedRoute');
        toast.success('Redirecting to payment gateway');
        window.location.assign(result.paymentUrl);
        return;
      }
      throw new Error('SSLCommerz did not return a payment page. Please check payment configuration.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='page-shell min-h-screen px-4 py-6 lg:px-8 lg:py-8'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <PageHero
          eyebrow='Voyage checkout'
          title='Choose cabins and complete your manifest.'
          description={`${selectedShip.name} from ${selectedRoute.departurePort} to ${selectedRoute.destinationPort}. Select cabins, add passenger details, and continue to secure payment.`}
          stats={[
            { label: 'Cabins Available', value: shipCabins.length },
            { label: 'Seats Remaining', value: selectedRoute.seatsAvailable },
            { label: 'Selected Cabins', value: cart.length },
          ]}
        />

        <div className='grid gap-8 lg:grid-cols-[1fr_380px]'>
          <div className='space-y-6'>
            <Card className='p-6'>
              <h2 className='font-display text-4xl font-semibold text-[#0f3b68]'>Route Summary</h2>
              <div className='mt-5 grid gap-4 md:grid-cols-2'>
                {[
                  { label: 'Ship', value: selectedShip.name },
                  { label: 'Operator', value: selectedShip.operator },
                  { label: 'Departure', value: `${selectedRoute.departurePort} at ${selectedRoute.departureTime}` },
                  { label: 'Arrival', value: `${selectedRoute.destinationPort} at ${selectedRoute.arrivalTime}` },
                ].map((item) => (
                  <div key={item.label} className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#7b91a1]'>{item.label}</p>
                    <p className='mt-3 font-semibold text-[#0f3b68]'>{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className='p-6'>
              <div className='mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div>
                  <h2 className='font-display text-4xl font-semibold text-[#0f3b68]'>Cabin Selection</h2>
                  <p className='mt-2 text-sm text-slate-600'>Select one or more cabins for this route.</p>
                </div>
                <div className='flex gap-2 text-xs'>
                  <span className='rounded-full bg-[#dff3ea] px-3 py-1 font-semibold uppercase tracking-[0.14em] text-[#187156]'>Selected</span>
                  <span className='rounded-full bg-[#eef7f8] px-3 py-1 font-semibold uppercase tracking-[0.14em] text-[#145a73]'>Available</span>
                </div>
              </div>

              {shipCabins.length === 0 ? (
                <div className='rounded-[1.6rem] border border-dashed border-[#cfdde4] p-10 text-center text-slate-500'>
                  No cabins are configured for this ship yet.
                </div>
              ) : (
                sortedFloorEntries.map(([floorLabel, floorCabins]) => (
                  <div key={floorLabel} className='mb-8'>
                    <div className='mb-4 rounded-[1.5rem] bg-[#eef7f8] px-5 py-4'>
                      <p className='text-xs uppercase tracking-[0.18em] text-[#7991a1]'>{floorLabel}</p>
                      <p className='mt-1 text-sm text-slate-600'>{floorCabins.length} cabins</p>
                    </div>
                    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                      {floorCabins.map((cabin) => {
                        const selected = cart.some((item) => item.cabinId === cabin.id);
                        return (
                          <button
                            key={cabin.id}
                            type='button'
                            onClick={() => void handleToggleCabin(cabin.id)}
                            className={`rounded-[1.7rem] border p-5 text-left transition ${
                              selected
                                ? 'border-[#8ed5c2] bg-[#eef8f4]'
                                : 'border-[#d8e3e8] bg-white hover:border-[#7cd4d8] hover:bg-[#f7fafb]'
                            }`}
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <h3 className='text-2xl font-semibold text-[#0f3b68]'>{cabin.number}</h3>
                                <p className='mt-2 text-sm font-semibold text-[#0f3b68]'>
                                  {CABIN_TYPES[cabin.type].name}
                                </p>
                              </div>
                              <Badge variant={selected ? 'success' : 'primary'}>
                                {selected ? 'Selected' : 'Available'}
                              </Badge>
                            </div>
                            <p className='mt-4 text-lg font-semibold text-[#0f3b68]'>
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

            {passengers.length > 0 ? (
              <Card className='p-6'>
                <h2 className='font-display text-4xl font-semibold text-[#0f3b68]'>Passenger Details</h2>
                <div className='mt-6 space-y-6'>
                  {passengers.map((passenger, index) => (
                    <div key={`${cart[index]?.cabinId ?? index}`} className='rounded-[1.7rem] border border-[#d9e4e8] bg-[#f7fafb] p-5'>
                      <h3 className='text-lg font-semibold text-[#0f3b68]'>Passenger {index + 1}</h3>
                      <div className='mt-4 grid gap-4 md:grid-cols-2'>
                        <Input label='First Name' value={passenger.firstName} onChange={(event) => updatePassenger(index, 'firstName', event.target.value)} />
                        <Input label='Last Name' value={passenger.lastName} onChange={(event) => updatePassenger(index, 'lastName', event.target.value)} />
                        <Input type='email' label='Email' value={passenger.email} onChange={(event) => updatePassenger(index, 'email', event.target.value)} />
                        <Input label='Phone' value={passenger.phone} onChange={(event) => updatePassenger(index, 'phone', event.target.value)} />
                        <Input type='number' label='Age' value={passenger.age || ''} onChange={(event) => updatePassenger(index, 'age', Number(event.target.value))} />
                        <Select
                          label='Gender'
                          value={passenger.gender}
                          onChange={(event) => updatePassenger(index, 'gender', event.target.value as Passenger['gender'])}
                          options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                          ]}
                        />
                        <Input label='Document Type' value={passenger.documentType} onChange={(event) => updatePassenger(index, 'documentType', event.target.value)} />
                        <Input label='Document Number' value={passenger.documentNumber} onChange={(event) => updatePassenger(index, 'documentNumber', event.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          <div>
            <Card className='sticky top-24 p-6'>
              <h2 className='font-display text-4xl font-semibold text-[#0f3b68]'>Booking Summary</h2>
              <div className='mt-6 space-y-3'>
                {cart.map((item, index) => (
                  <div key={item.cabinId} className='rounded-[1.4rem] bg-[#f7fafb] p-4'>
                    <div className='mb-2 flex items-start justify-between'>
                      <div>
                        <p className='font-semibold text-[#0f3b68]'>{item.cabinNumber}</p>
                        <p className='text-xs text-slate-600'>{CABIN_TYPES[item.cabinType].name}</p>
                      </div>
                      <button
                        type='button'
                        onClick={() => void handleToggleCabin(item.cabinId)}
                        className='rounded-full border border-[#d9e4e8] bg-white p-2 text-[#8d5a5a] hover:text-[#973f3f]'
                        aria-label={`Remove cabin ${item.cabinNumber}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className='font-semibold text-[#0f3b68]'>{formatCurrency(item.pricePerUnit)}</p>
                    <p className='mt-1 text-xs text-slate-500'>Passenger {index + 1}</p>
                  </div>
                ))}
              </div>

              {cart.length === 0 ? (
                <p className='py-6 text-center text-sm text-slate-500'>No cabins selected yet.</p>
              ) : null}

              <div className='mt-6 space-y-3 border-t border-[#dde7eb] pt-5'>
                <div className='flex justify-between text-slate-600'>
                  <p>Subtotal</p>
                  <p className='font-semibold'>{formatCurrency(totalPrice)}</p>
                </div>
                <div className='flex justify-between text-slate-600'>
                  <p>Platform Fee</p>
                  <p className='font-semibold'>Included</p>
                </div>
                <div className='flex justify-between border-t border-[#dde7eb] pt-3 text-lg font-bold text-[#0f3b68]'>
                  <p>Total</p>
                  <p>{formatCurrency(totalPrice)}</p>
                </div>
              </div>

              <Button fullWidth onClick={handleCompleteBooking} disabled={cart.length === 0 || submitting} className='mt-6'>
                <CreditCard size={18} />
                {submitting ? 'Redirecting...' : 'Proceed to Payment'}
              </Button>

              <div className='mt-4 rounded-[1.5rem] bg-[#eef7f8] p-4 text-sm leading-7 text-slate-600'>
                <div className='flex items-start gap-3'>
                  <Ticket size={17} className='mt-1 text-[#1d7e93]' />
                  You will be redirected to SSLCommerz, where customers can choose cards, bank transfer, or mobile banking options.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
