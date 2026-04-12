'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LifeBuoy, LogOut, Menu, ShipWheel, UserRound, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const publicLinks = [
  { href: '/', label: 'Voyages' },
  { href: '/customer/dashboard', label: 'Explore' },
  { href: '/customer/bookings', label: 'My Bookings' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) {
      return '/';
    }

    if (user.role === 'customer') {
      return '/customer/dashboard';
    }
    if (user.role === 'shipowner') {
      return '/shipowner/dashboard';
    }
    return '/admin/dashboard';
  };

  const navLinkClass = (href: string) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      pathname === href
        ? 'bg-[#0f3b68] text-white'
        : 'text-[#234768] hover:bg-white/80 hover:text-[#0f3b68]'
    }`;

  return (
    <nav className='sticky top-0 z-50 border-b border-white/35 bg-[#f4f2eb]/85 backdrop-blur-xl'>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8'>
        <Link href='/' className='flex items-center gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f3b68] text-white shadow-lg shadow-[#0f3b68]/20'>
            <ShipWheel size={20} />
          </div>
          <div>
            <p className='font-display text-2xl font-semibold leading-none text-[#0f3b68]'>
              Hatiya Editorial
            </p>
            <p className='mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#5c7d93]'>
              Coastal bookings
            </p>
          </div>
        </Link>

        <div className='hidden items-center gap-2 lg:flex'>
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          <Link href='/signup/shipowner' className={navLinkClass('/signup/shipowner')}>
            Partner Signup
          </Link>
        </div>

        <div className='hidden items-center gap-3 lg:flex'>
          {user ? (
            <>
              <div className='flex items-center gap-3 rounded-full border border-[#d8e3e8] bg-white/80 px-4 py-2 text-sm text-[#234768]'>
                <div className='flex h-9 w-9 items-center justify-center rounded-full bg-[#dff5f5] text-[#0f3b68]'>
                  <UserRound size={16} />
                </div>
                <div>
                  <p className='font-semibold'>{user.name}</p>
                  <p className='text-xs uppercase tracking-[0.16em] text-[#6b8799]'>
                    {user.role}
                  </p>
                </div>
              </div>
              <Link
                href={getDashboardLink()}
                className='rounded-full bg-[#0f3b68] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f3b68]/20 hover:bg-[#0a2c4f]'
              >
                Dashboard
              </Link>
              <button
                type='button'
                onClick={handleLogout}
                className='inline-flex items-center gap-2 rounded-full border border-[#d5dee5] bg-white px-5 py-3 text-sm font-semibold text-[#0f3b68] hover:bg-[#f4f8f8]'
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className='rounded-full px-5 py-3 text-sm font-semibold text-[#234768] hover:bg-white/80'
              >
                Sign in
              </Link>
              <Link
                href='/signup'
                className='rounded-full bg-[#0f3b68] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f3b68]/20 hover:bg-[#0a2c4f]'
              >
                Customer Signup
              </Link>
            </>
          )}
        </div>

        <button
          type='button'
          className='inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe4ea] bg-white text-[#0f3b68] lg:hidden'
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className='border-t border-white/30 bg-[#f4f2eb] px-4 py-4 lg:hidden'>
          <div className='space-y-2'>
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='block rounded-2xl px-4 py-3 text-sm font-semibold text-[#234768] hover:bg-white'
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href='/signup/shipowner'
              className='block rounded-2xl px-4 py-3 text-sm font-semibold text-[#234768] hover:bg-white'
              onClick={() => setMobileMenuOpen(false)}
            >
              Partner Signup
            </Link>
          </div>

          <div className='mt-4 space-y-2 border-t border-[#dbe4ea] pt-4'>
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className='block rounded-2xl bg-[#0f3b68] px-4 py-3 text-sm font-semibold text-white'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type='button'
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className='flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dbe4ea] bg-white px-4 py-3 text-sm font-semibold text-[#0f3b68]'
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href='/login'
                  className='block rounded-2xl border border-[#dbe4ea] bg-white px-4 py-3 text-center text-sm font-semibold text-[#0f3b68]'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href='/signup'
                  className='block rounded-2xl bg-[#0f3b68] px-4 py-3 text-center text-sm font-semibold text-white'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Customer Signup
                </Link>
              </>
            )}
          </div>

          <div className='mt-4 flex items-center gap-2 rounded-2xl bg-[#e4f2f4] px-4 py-3 text-sm text-[#234768]'>
            <LifeBuoy size={16} className='text-[#1d7e93]' />
            Admin provisioning happens inside the platform user management area.
          </div>
        </div>
      ) : null}
    </nav>
  );
}
