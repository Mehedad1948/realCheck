'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Cta } from '@/components/site/cta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/server/actions/auth';

export function LoginForm() {
  const next = useSearchParams().get('next') ?? '';
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" defaultValue={state?.email} required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Cta type="submit" className="w-full" disabled={isPending} icon={isPending ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : undefined}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Cta>
    </form>
  );
}
