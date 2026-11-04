'use client';

import { Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAction } from '@/server/actions/auth';

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" defaultValue={state?.email} required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="h-11" aria-describedby="password-hint" />
        <p id="password-hint" className="text-[13px] text-muted-foreground">
          At least 8 characters.
        </p>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
