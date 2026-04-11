'use client';

import React, { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { ToastContainer } from 'react-toastify';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className='min-h-screen bg-gray-50'>{children}</main>
      <ToastContainer position='bottom-right' />
    </>
  );
}
