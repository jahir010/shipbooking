'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      
      const user = useAuthStore.getState().user;
      if (user) {
        const dashboardMap = {
          customer: '/customer/dashboard',
          shipowner: '/shipowner/dashboard',
          admin: '/admin/dashboard',
        };
        router.push(dashboardMap[user.role]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoRole: 'customer' | 'shipowner' | 'admin') => {
    setEmail(`${demoRole}@example.com`);
    setPassword('demo123');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <div className='p-8'>
          <div className='flex items-center gap-2 mb-6'>
            <span className='text-3xl'>⚓</span>
            <h1 className='text-2xl font-bold'>ShipBook</h1>
          </div>

          <h2 className='text-xl font-semibold mb-6'>Login</h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <Input
              type='email'
              label='Email Address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              disabled={loading}
            />

            <Input
              type='password'
              label='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              disabled={loading}
            />
            <Button
              type='submit'
              fullWidth
              disabled={loading}
              size='lg'
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className='mt-6 pt-6 border-t'>
            <p className='text-sm text-gray-600 mb-3'>Demo Accounts:</p>
            <div className='space-y-2'>
              <Button
                variant='secondary'
                fullWidth
                onClick={() => fillDemoCredentials('customer')}
                disabled={loading}
              >
                Demo Customer
              </Button>
              <Button
                variant='secondary'
                fullWidth
                onClick={() => fillDemoCredentials('shipowner')}
                disabled={loading}
              >
                Demo Ship Owner
              </Button>
              <Button
                variant='secondary'
                fullWidth
                onClick={() => fillDemoCredentials('admin')}
                disabled={loading}
              >
                Demo Admin
              </Button>
            </div>
          </div>

          <p className='mt-6 text-center text-sm text-gray-600'>
            Don&apos;t have an account?{' '}
            <Link href='/signup' className='text-blue-600 font-semibold hover:underline'>
              Sign up here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
