'use client';

import Link from 'next/link';
import { useActionState } from 'react'; // If using React 19/Next 15, otherwise use standard form action
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { registerAction } from '../actions/auth/register';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                </>
            ) : (
                'Create Account'
            )}
        </button>
    );
}

export default function RegisterPage() {
    // We wrap the action to handle the return value (error message)
    // Initial state is null or an object with an error
    const [state, action] = useActionState(registerAction, null);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-6">

                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-10 w-10 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                            R
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Create an account
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your email below to create your account
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 pt-6">
                        <form action={action} className="space-y-4">

                            {/* Error Message Display */}
                            {state?.error && (
                                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium text-center border border-destructive/20">
                                    {state.error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Must be at least 6 characters.
                                </p>
                            </div>

                            <SubmitButton />
                        </form>
                    </div>
                </div>

                {/* Footer Links */}
                <p className="px-8 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    );
}
