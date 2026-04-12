import SignupForm from '@/components/auth/SignupForm';

export default function ShipownerSignupPage() {
  return (
    <SignupForm
      role='shipowner'
      eyebrow='Operator onboarding'
      title='Launch your'
      accent='fleet workspace'
      description='Open a shipowner account to manage ships, routes, cabins, bookings, and invoice-ready operations from a partner dashboard built for real schedules.'
    />
  );
}
