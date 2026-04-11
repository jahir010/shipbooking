'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { toast } from 'react-toastify';
import { validateEmail, validatePhone } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const { login, register } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'shipowner' | 'admin',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const [firstName, ...rest] = formData.name.trim().split(/\s+/);
      const lastName = rest.join(' ');
      await register(
        formData.email,
        formData.password,
        firstName || '',
        lastName || '',
        formData.role
      );

      await login(formData.email, formData.password);
      toast.success('Account created successfully!');

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
      toast.error(error instanceof Error ? error.message : 'Signup failed. Please try again.');
      console.error('Signup error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <div className='p-8'>
          <div className='flex items-center gap-2 mb-6'>
            <span className='text-3xl'>⚓</span>
            <h1 className='text-2xl font-bold'>ShipBook</h1>
          </div>

          <h2 className='text-xl font-semibold mb-6'>Create Account</h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <Input
              type='text'
              name='name'
              label='Full Name'
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder='John Doe'
              disabled={loading}
            />

            <Input
              type='email'
              name='email'
              label='Email Address'
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder='you@example.com'
              disabled={loading}
            />

            <Input
              type='tel'
              name='phone'
              label='Phone Number'
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder='+1 (555) 123-4567'
              disabled={loading}
            />

            <Select
              name='role'
              label='Account Type'
              value={formData.role}
              onChange={handleInputChange}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'shipowner', label: 'Ship Owner/Manager' },
                { value: 'admin', label: 'Administrator' },
              ]}
              disabled={loading}
            />

            <Input
              type='password'
              name='password'
              label='Password'
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder='Enter your password'
              disabled={loading}
            />

            <Input
              type='password'
              name='confirmPassword'
              label='Confirm Password'
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder='Confirm your password'
              disabled={loading}
            />

            <Button
              type='submit'
              fullWidth
              disabled={loading}
              size='lg'
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <p className='mt-6 text-center text-sm text-gray-600'>
            Already have an account?{' '}
            <Link href='/login' className='text-blue-600 font-semibold hover:underline'>
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
