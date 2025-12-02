"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from '../actions/auth/login';
import Link from 'next/link';

export default function LoginPage() {
    // useActionState handles the form submission, loading state, and return values (errors)
    const [state, action, isPending] = useActionState(loginAction, undefined);

    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <Card className="mx-auto w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="grid gap-4">

                        {/* Email Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        {/* Error Message Display */}
                        {state?.error && (
                            <p className="text-sm text-red-500">{state.error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Logging in..." : "Login"}
                        </Button>
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                Sign up
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
