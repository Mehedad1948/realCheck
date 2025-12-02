'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { encrypt, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

// 1. Define a return type for the state
export type AuthState = {
  error?: string;
} | null;

// 2. Update the function signature
// prevState is required by useActionState, even if you don't use it logic-wise
export async function registerAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'This email is already registered.' };
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CLIENT',
      },
    });

    // Auto-Login Logic
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const session = await encrypt({ 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
    });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        sameSite: 'lax',
        path: '/',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }

  // Redirect MUST happen outside the try/catch block in Server Actions
  redirect('/dashboard');
}
