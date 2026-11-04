import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/server/db';
import { errors } from '@/server/errors';
import { readSession } from './session';

// Data access layer for web (dashboard) authentication.
// The proxy only does an optimistic cookie check; every page, action and route
// handler re-checks here against the database.

export type Viewer = {
  id: string;
  email: string | null;
  name: string | null;
  role: 'CLIENT' | 'EVALUATOR' | 'ADMIN';
  balanceCents: number;
};

/** The signed-in web user, read fresh from the database once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, balanceCents: true },
  });
});

/** For pages: sends anyone who isn't a client to the login page. */
export async function requireClientPage(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== 'CLIENT') redirect('/login');
  return viewer;
}

/** For Server Actions and Route Handlers: throws instead of redirecting. */
export async function requireClient(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw errors.unauthorized();
  if (viewer.role !== 'CLIENT') throw errors.forbidden('Only client accounts can manage datasets.');
  return viewer;
}
