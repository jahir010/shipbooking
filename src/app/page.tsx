'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { Ship, Users, MapPin, Clock, DollarSign } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className='flex flex-col'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4'>
        <div className='max-w-7xl mx-auto text-center'>
          <div className='text-6xl mb-4'>⚓</div>
          <h1 className='text-5xl font-bold mb-6'>Welcome to ShipBook</h1>
          <p className='text-xl mb-8 text-blue-100'>
            Your trusted platform for ship booking, from luxury river cruises to everyday ferries
          </p>
          <div className='flex gap-4 justify-center flex-wrap'>
            {!user ? (
              <>
                <Link href='/login'>
                  <Button size='lg'>Login</Button>
                </Link>
                <Link href='/signup'>
                  <Button variant='secondary' size='lg'>
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <Link
                href={
                  user.role === 'customer'
                    ? '/customer/dashboard'
                    : user.role === 'shipowner'
                    ? '/shipowner/dashboard'
                    : '/admin/dashboard'
                }
              >
                <Button size='lg'>Go to Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 px-4 bg-white'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-4xl font-bold text-center mb-12 text-gray-800'>
            Why Choose ShipBook?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {[
              {
                icon: <Ship className='w-12 h-12 text-blue-600' />,
                title: 'Wide Selection',
                description:
                  'Explore hundreds of ships from luxury cruises to budget-friendly ferries',
              },
              {
                icon: <MapPin className='w-12 h-12 text-blue-600' />,
                title: 'Multiple Routes',
                description:
                  'Access routes across major rivers and ports nationwide',
              },
              {
                icon: <Clock className='w-12 h-12 text-blue-600' />,
                title: 'Easy Booking',
                description:
                  'Quick and simple booking process with real-time availability',
              },
              {
                icon: <DollarSign className='w-12 h-12 text-blue-600' />,
                title: 'Best Prices',
                description:
                  'Competitive prices with regular deals and discounts',
              },
              {
                icon: <Users className='w-12 h-12 text-blue-600' />,
                title: 'Customer Support',
                description: '24/7 support to help you with any questions or issues',
              },
              {
                icon: <Ship className='w-12 h-12 text-blue-600' />,
                title: 'Cabin Variety',
                description:
                  'Choose from riverside, inside, double, family, and VIP cabins',
              },
            ].map((feature, index) => (
              <div key={index} className='p-6 border border-gray-200 rounded-lg'>
                <div className='mb-4'>{feature.icon}</div>
                <h3 className='text-xl font-semibold mb-2 text-gray-800'>
                  {feature.title}
                </h3>
                <p className='text-gray-600'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-blue-50 py-20 px-4'>
        <div className='max-w-7xl mx-auto text-center'>
          <h2 className='text-4xl font-bold mb-6 text-gray-800'>
            Ready to Book Your Next Journey?
          </h2>
          <p className='text-lg text-gray-600 mb-8'>
            Join thousands of happy travelers. Book your ship ticket today!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-300 py-12 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
            <div>
              <h3 className='text-white font-bold mb-4'>ShipBook</h3>
              <p>Your trusted ship booking platform.</p>
            </div>
            <div>
              <h4 className='text-white font-semibold mb-4'>Quick Links</h4>
              <ul className='space-y-2'>
                <li>
                  <Link href='/' className='hover:text-white'>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href='/login' className='hover:text-white'>
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='text-white font-semibold mb-4'>Support</h4>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-white'>
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-white'>
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='text-white font-semibold mb-4'>Legal</h4>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-white'>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-white'>
                    Terms & Conditions
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-gray-700 pt-8 text-center'>
            <p>&copy; 2024 ShipBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
