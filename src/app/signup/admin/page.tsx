import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/ui/Button';

export default function AdminSignupPage() {
  return (
    <AuthShell
      eyebrow='Internal provisioning'
      title='Admin access is'
      accent='issued internally'
      description='Platform administrators are created through secured user management, not public self-signup. This keeps oversight, billing, and account control production-safe.'
    >
      <div className='rounded-[1.6rem] border border-[#d9e8ec] bg-[#eef7f8] p-5'>
        <div className='flex items-start gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f3b68] text-white'>
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.22em] text-[#1d7e93]'>
              Protected workflow
            </p>
            <p className='mt-2 text-sm leading-6 text-slate-600'>
              Existing admins can create and manage other users from the admin dashboard, including
              shipowners and internal operators. If you already have credentials, use the sign-in
              route below.
            </p>
          </div>
        </div>
      </div>

      <div className='mt-6 space-y-3'>
        <Link href='/login' className='block'>
          <Button fullWidth size='lg' className='rounded-2xl bg-[#0f3b68] py-3 text-white hover:bg-[#0a2c4f]'>
            Go to admin sign in
          </Button>
        </Link>
        <Link href='/signup/shipowner' className='block'>
          <Button
            fullWidth
            variant='secondary'
            className='rounded-2xl border border-slate-200 bg-white py-3 text-[#0f3b68] hover:bg-[#f4f8f8]'
          >
            Explore shipowner signup
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
