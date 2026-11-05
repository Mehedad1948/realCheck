import { connection } from 'next/server';
import { getOpenDatasets } from '@/server/queries/public';

// Public and viewer-independent: served from the `use cache` entry and invalidated
// by the `datasets:open` tag. Resolved at request time so builds never need the database.
export async function GET() {
  await connection();
  return Response.json(await getOpenDatasets());
}
