'use server';

import { prisma } from '@/lib/prisma'; // Your prisma client instance
import { comparePassword, encrypt, SESSION_DURATION } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: 'Invalid inputs' };
  }

  const { email, password } = result.data;

  console.log('❌❌❌', { email, password });

  const user = await prisma.user.findUnique({
    where: { email },
  });

  console.log('🐞🐞🐞', user);

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  // 2. Verify Password
  if (user.password) {
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid credentials' };
    }
  } else {
    return { error: 'Use Telegram login' };
  }

  // 3. Create JWT Session
  // We only store minimal data in the token to keep it small
  const session = await encrypt({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // 4. Set HttpOnly Cookie
  (await cookies()).set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + SESSION_DURATION * 1000),
    path: '/',
    sameSite: 'lax',
  });

  // 5. Redirect based on role
  if (user.role === 'CLIENT') {
    redirect('/dashboard');
  } else {
    redirect('/');
  }
}
