'use server';

import { refresh } from 'next/cache';
import { topUpSchema } from '@/lib/validation';
import { prisma } from '@/server/db';
import { env } from '@/server/env';
import { errors } from '@/server/errors';
import { clientAction } from './client-action';

/**
 * Demo top-up: credits the balance without taking a payment. Disabled unless
 * ENABLE_DEMO_TOP_UP=true. Replace with a payment provider webhook before launch.
 */
export const topUpAction = clientAction(topUpSchema, async ({ amountCents }, viewer) => {
  if (!env().ENABLE_DEMO_TOP_UP) {
    throw errors.forbidden('Top-ups are not available yet.');
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.create({
      data: { userId: viewer.id, type: 'TOP_UP', amountCents, note: 'Demo top-up' },
    });
    return tx.user.update({
      where: { id: viewer.id },
      data: { balanceCents: { increment: amountCents } },
      select: { balanceCents: true },
    });
  });

  // Balances aren't cached, so re-render the current page to show the new amount.
  refresh();
  return { balanceCents: user.balanceCents };
});
