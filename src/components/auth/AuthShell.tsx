'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, ShipWheel, Waves } from 'lucide-react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({
  eyebrow,
  title,
  description,
  accent,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className='relative min-h-screen overflow-hidden bg-[#e9f1f3]'>
      <div className='absolute inset-0 bg-[url("https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80")] bg-cover bg-center' />
      <div className='absolute inset-0 bg-gradient-to-r from-[#08233d]/88 via-[#0b385a]/62 to-[#08233d]/30' />
      <div className='absolute -left-28 top-20 h-80 w-80 rounded-full bg-[#56d4d8]/25 blur-3xl' />
      <div className='absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#cfe5ea]/30 blur-3xl' />

      <div className='relative mx-auto grid min-h-screen max-w-7xl gap-12 px-4 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8'>
        <div className='flex flex-col justify-between rounded-[2rem] border border-white/12 bg-white/6 p-6 text-white shadow-[0_30px_80px_rgba(8,35,61,0.28)] backdrop-blur-sm lg:p-10'>
          <div className='flex items-center justify-between gap-4'>
            <Link href='/' className='font-display text-3xl font-semibold tracking-wide text-white'>
              Hatiya Voyages
            </Link>
            <Link
              href='/'
              className='inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/16'
            >
              Back to home
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className='max-w-2xl py-10 lg:py-16'>
            <p className='mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#8ce7ea]'>
              {eyebrow}
            </p>
            <h1 className='font-display text-5xl font-semibold leading-[0.92] text-white md:text-7xl'>
              {title}{' '}
              <span className='text-[#8ce7ea]'>{accent}</span>
            </h1>
            <p className='mt-6 max-w-xl text-lg leading-8 text-white/76'>{description}</p>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            {[
              {
                icon: ShipWheel,
                label: 'Trusted Operators',
                text: 'Curated vessels, real cabins, verified schedules.',
              },
              {
                icon: Compass,
                label: 'Production Flow',
                text: 'Separate onboarding paths for passengers and partners.',
              },
              {
                icon: Waves,
                label: 'Operational Control',
                text: 'Admin tools for access, provisioning, and oversight.',
              },
            ].map((item) => (
              <div key={item.label} className='rounded-3xl border border-white/14 bg-white/8 p-4 backdrop-blur-sm'>
                <item.icon size={18} className='text-[#8ce7ea]' />
                <p className='mt-4 text-sm font-semibold text-white'>{item.label}</p>
                <p className='mt-2 text-sm leading-6 text-white/72'>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='flex items-center justify-center'>
          <div className='glass-panel w-full max-w-xl rounded-[2rem] p-5 lg:p-7'>
            <div className='rounded-[1.7rem] bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,59,104,0.12)] lg:p-8'>
              {children}
              {footer ? <div className='mt-6 border-t border-slate-200/80 pt-6'>{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
