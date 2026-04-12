'use client';

import React, { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: Array<{ label: string; value: string | number }>;
}

export default function PageHero({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
}: PageHeroProps) {
  return (
    <section className='relative overflow-hidden rounded-[2.6rem] px-6 py-10 text-white shadow-[0_30px_80px_rgba(8,35,61,0.18)] lg:px-10 lg:py-12'>
      <div className='absolute inset-0 bg-gradient-to-r from-[#08233d] via-[#0f3b68] to-[#1d7e93]' />
      <div className='absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#56d4d8]/18 blur-3xl' />
      <div className='absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl' />
      <div className='relative'>
        <div className='flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-3xl'>
            <p className='text-sm font-semibold uppercase tracking-[0.28em] text-[#8ce7ea]'>
              {eyebrow}
            </p>
            <h1 className='mt-4 font-display text-5xl font-semibold leading-[0.92] lg:text-6xl'>
              {title}
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-8 text-white/76 lg:text-lg'>
              {description}
            </p>
          </div>
          {actions ? <div className='flex flex-wrap gap-3'>{actions}</div> : null}
        </div>

        {stats.length > 0 ? (
          <div className='mt-8 grid gap-4 md:grid-cols-3'>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className='rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm'
              >
                <p className='text-3xl font-semibold'>{stat.value}</p>
                <p className='mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/62'>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
