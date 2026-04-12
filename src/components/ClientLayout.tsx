'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ToastContainer } from 'react-toastify';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname.startsWith('/login') || pathname.startsWith('/signup');

  return (
    <>
      {!hideNavbar ? <Navbar /> : null}
      <main className='min-h-screen bg-gray-50'>{children}</main>
      <ToastContainer position='bottom-right' />
    </>
  );
}
