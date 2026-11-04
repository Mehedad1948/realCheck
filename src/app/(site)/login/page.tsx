import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/site/auth-shell';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your datasets and results."
      footer={
        <>
          New to RealCheck?{' '}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {/* The form reads ?next= from the URL, which is request-time data. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
