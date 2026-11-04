'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { loginSchema, registerSchema } from '@/lib/validation';
import { createSession, deleteSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { isUniqueViolation } from '@/server/errors';

export type AuthFormState = { error?: string; email?: string } | undefined;

// Compared against when the email doesn't exist, so both paths take similar time.
const DUMMY_HASH = '$2b$12$0Xi4jmJw6kV6.Mg6TOD5jePcz2rcBgddOR7VAKdOKXzrJOV5n.rga';

/** Only same-site dashboard paths, so `?next=` can't become an open redirect. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : '';
  return /^\/dashboard(?:[/?#]|$)/.test(next) && !next.includes('//') ? next : '/dashboard';
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get('email') ?? '');
  if (!parsed.success) return { error: 'Enter your email and password.', email };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true, password: true },
  });
  const valid = await bcrypt.compare(parsed.data.password, user?.password ?? DUMMY_HASH);
  if (!user || !user.password || !valid) return { error: 'Invalid email or password.', email };
  if (user.role !== 'CLIENT') return { error: 'This account can’t use the dashboard.', email };

  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get('next')));
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get('email') ?? '');
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.', email };

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        password: await bcrypt.hash(parsed.data.password, 12),
        role: 'CLIENT',
      },
      select: { id: true, role: true },
    });
    await createSession({ userId: user.id, role: user.role });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: 'This email is already registered.', email };
    console.error('[auth] registration failed', error);
    return { error: 'Something went wrong. Please try again.', email };
  }
  redirect('/dashboard');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
