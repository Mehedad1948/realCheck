import { getOpenDatasets } from '@/server/queries/public';

// Public and viewer-independent: served from the `use cache` entry, so it can be
// prerendered and is invalidated by the `datasets:open` tag.
export async function GET() {
  return Response.json(await getOpenDatasets());
}
