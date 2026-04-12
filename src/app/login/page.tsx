'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      toast.success('Welcome back');

      if (user) {
        const dashboardMap = {
          customer: '/customer/dashboard',
          shipowner: '/shipowner/dashboard',
          admin: '/admin/dashboard',
        };
        router.push(dashboardMap[user.role]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow='Member access'
      title='Return to the'
      accent='voyage desk'
      description='Sign in to manage bookings, operations, and partner activity from the same platform your passengers rely on.'
      footer={
        <div className='space-y-3 text-center text-sm text-slate-600'>
          <p>
            New passenger?{' '}
            <Link href='/signup' className='font-semibold text-[#0f3b68] hover:text-[#1d7e93]'>
              Create a customer account
            </Link>
          </p>
          <p>
            Running a vessel?{' '}
            <Link
              href='/signup/shipowner'
              className='font-semibold text-[#0f3b68] hover:text-[#1d7e93]'
            >
              Open a shipowner account
            </Link>
          </p>
        </div>
      }
    >
      <div className='rounded-[1.5rem] border border-[#d9e8ec] bg-[#eef7f8] p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f3b68] text-white'>
            <LockKeyhole size={20} />
          </div>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.22em] text-[#1d7e93]'>
              Secure sign in
            </p>
            <p className='mt-1 text-sm leading-6 text-slate-600'>
              Role-aware routing takes you directly to your customer, shipowner, or admin workspace.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
        <Input
          type='email'
          label='Email address'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder='captain@company.com'
          disabled={loading}
          className='rounded-2xl border-slate-200 bg-white/90 px-4 py-3'
        />
        <Input
          type='password'
          label='Password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder='Enter your password'
          disabled={loading}
          className='rounded-2xl border-slate-200 bg-white/90 px-4 py-3'
        />

        <div className='rounded-[1.5rem] border border-slate-200 bg-[#f7f8f8] p-4 text-sm text-slate-600'>
          <div className='flex items-start gap-3'>
            <ShieldCheck size={18} className='mt-1 text-[#1d7e93]' />
            <p>
              Demo credentials have been removed. Suspended accounts are blocked from signing in
              until an administrator reactivates them.
            </p>
          </div>
        </div>

        <Button
          type='submit'
          fullWidth
          size='lg'
          disabled={loading}
          className='rounded-2xl bg-[#0f3b68] py-3 text-white hover:bg-[#0a2c4f]'
        >
          {loading ? 'Signing in...' : 'Sign in'}
          {!loading ? <ArrowRight size={18} /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}
