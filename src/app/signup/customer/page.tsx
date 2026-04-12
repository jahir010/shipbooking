import SignupForm from '@/components/auth/SignupForm';

export default function CustomerSignupPage() {
  return (
    <SignupForm
      role='customer'
      eyebrow='Passenger onboarding'
      title='Reserve the'
      accent='next departure'
      description='A customer account gives travelers fast booking, passenger management, invoice downloads, and smooth access to upcoming and past voyages.'
    />
  );
}
