import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/site/auth-shell';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start collecting verified labels in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
