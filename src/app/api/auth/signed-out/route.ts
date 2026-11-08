import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { deleteSession } from '@/server/auth/session';

/**
 * Where the DAL sends a request whose session cookie is validly signed but no longer matches the
 * database (account deleted, role changed, database reset). Server Components can't clear
 * cookies, and the proxy trusts the cookie, so without this the proxy and the page would
 * redirect to each other forever.
 */
export async function GET(request: NextRequest) {
  await deleteSession();
  redirect(request.nextUrl.searchParams.get('to') === 'earn' ? '/earn/login' : '/login');
}
