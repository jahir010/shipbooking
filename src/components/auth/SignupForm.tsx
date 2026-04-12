'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { validateEmail } from '@/lib/utils';

interface SignupFormProps {
  role: Extract<UserRole, 'customer' | 'shipowner'>;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
}

const roleMeta = {
  customer: {
    icon: UserRound,
    label: 'Customer account',
    helper: 'Book voyages, manage passengers, and download invoices in one place.',
  },
  shipowner: {
    icon: Building2,
    label: 'Shipowner account',
    helper: 'Manage vessels, routes, cabins, and traveler activity with a dedicated dashboard.',
  },
};

export default function SignupForm({
  role,
  eyebrow,
  title,
  accent,
  description,
}: SignupFormProps) {
  const router = useRouter();
  const { login, register } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const meta = roleMeta[role];

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required';
    }
    if (!validateEmail(formData.email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      const [firstName, ...rest] = formData.name.trim().split(/\s+/);
      const lastName = rest.join(' ');
      await register(formData.email, formData.password, firstName || '', lastName || '', role);
      await login(formData.email, formData.password);
      toast.success('Account created successfully');

      const destination = role === 'shipowner' ? '/shipowner/dashboard' : '/customer/dashboard';
      router.push(destination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create account right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={eyebrow}
      title={title}
      accent={accent}
      description={description}
      footer={
        <p className='text-center text-sm text-slate-600'>
          Already have access?{' '}
          <Link href='/login' className='font-semibold text-[#0f3b68] hover:text-[#1d7e93]'>
            Sign in
          </Link>
        </p>
      }
    >
      <div className='rounded-[1.5rem] border border-slate-200 bg-[#f6f8f8] p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f3b68] text-white'>
            <meta.icon size={20} />
          </div>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.22em] text-[#1d7e93]'>
              {meta.label}
            </p>
            <p className='mt-1 text-sm leading-6 text-slate-600'>{meta.helper}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
        <Input
          name='name'
          label='Full name'
          value={formData.name}
          onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
          error={errors.name}
          placeholder='Afsana Rahman'
          disabled={loading}
          className='rounded-2xl border-slate-200 bg-white/90 px-4 py-3'
        />
        <Input
          type='email'
          name='email'
          label='Work email'
          value={formData.email}
          onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
          placeholder='you@example.com'
          disabled={loading}
          className='rounded-2xl border-slate-200 bg-white/90 px-4 py-3'
        />
        <div className='grid gap-4 md:grid-cols-2'>
          <Input
            type='password'
            name='password'
            label='Password'
            value={formData.password}
            onChange={(event) =>
              setFormData((current) => ({ ...current, password: event.target.value }))
            }
            error={errors.password}
            placeholder='Minimum 6 characters'
            disabled={loading}
            className='rounded-2xl border-slate-200 bg-white/90 px-4 py-3'
          />
          <Input
            type='password'
            name='confirmPassword'
            label='Confirm password'
            value={formData.confirmPassword}
            onChange={(event) =>
              setFormData((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            error={errors.confirmPassword}
            placeholder='Repeat your password'
            disabled={loading}
            className='rounded-2xl border-slate-200 bg-white/90 px-4 py-3'
          />
        </div>

        <div className='rounded-[1.5rem] border border-[#d9e8ec] bg-[#eef7f8] p-4 text-sm leading-6 text-slate-600'>
          <div className='flex items-start gap-3'>
            <ShieldCheck size={18} className='mt-1 text-[#1d7e93]' />
            <p>
              Your account is created with active access and role-based routing. Admin accounts are
              provisioned internally through platform user management.
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
          {loading ? 'Creating account...' : 'Create account'}
          {!loading ? <ArrowRight size={18} /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}
