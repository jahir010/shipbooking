'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'customer':
        return '/customer/dashboard';
      case 'shipowner':
        return '/shipowner/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return null;
    }
  };

  return (
    <nav className='bg-blue-600 text-white shadow-lg'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          <Link href='/' className='flex items-center gap-2 font-bold text-xl'>
            <span>⚓</span>
            <span>ShipBook</span>
          </Link>

          {/* Desktop Menu */}
          <div className='hidden md:flex items-center gap-6'>
            {user ? (
              <>
                <span className='text-sm'>
                  Welcome, <span className='font-semibold'>{user.name}</span>
                </span>
                <Link
                  href={getDashboardLink() || '/'}
                  className='px-4 py-2 rounded bg-blue-700 hover:bg-blue-800'
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className='px-4 py-2 rounded bg-red-600 hover:bg-red-700 flex items-center gap-2'
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href='/login'
                  className='px-4 py-2 rounded hover:bg-blue-700'
                >
                  Login
                </Link>
                <Link
                  href='/signup'
                  className='px-4 py-2 rounded bg-blue-700 hover:bg-blue-800'
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className='md:hidden'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden pb-4 border-t border-blue-500'>
            {user ? (
              <>
                <p className='py-2 px-2 text-sm'>
                  Welcome, <span className='font-semibold'>{user.name}</span>
                </p>
                <Link
                  href={getDashboardLink() || '/'}
                  className='block py-2 px-4 rounded hover:bg-blue-700'
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className='w-full text-left py-2 px-4 rounded hover:bg-red-600'
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href='/login'
                  className='block py-2 px-4 rounded hover:bg-blue-700'
                >
                  Login
                </Link>
                <Link
                  href='/signup'
                  className='block py-2 px-4 rounded hover:bg-blue-700'
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
