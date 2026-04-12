import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <SignupForm
      role='customer'
      eyebrow='Passenger onboarding'
      title='Start your'
      accent='coastal journey'
      description='Create a customer account to browse live routes, reserve cabins, pay securely, and keep every invoice attached to your booking history.'
    />
  );
}
