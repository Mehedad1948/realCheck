import 'server-only';
import { revalidateTag, updateTag } from 'next/cache';
import { tags } from './cache-tags';

/**
 * `immediate` (Server Actions): the next read waits for fresh data, so the user who
 * made the change sees it. `background` (Route Handlers, where `updateTag` is not
 * allowed): stale-while-revalidate, fine for changes caused by other people's votes.
 */
type Mode = 'immediate' | 'background';

function expire(tag: string, mode: Mode) {
  if (mode === 'immediate') updateTag(tag);
  else revalidateTag(tag, 'max');
}

export function expireDataset({ datasetId, ownerId }: { datasetId: string; ownerId: string }, mode: Mode) {
  expire(tags.dataset(datasetId), mode);
  expire(tags.ownerDatasets(ownerId), mode);
  expire(tags.openDatasets, mode);
}

export function expireOwnerDatasets(ownerId: string, mode: Mode) {
  expire(tags.ownerDatasets(ownerId), mode);
  expire(tags.openDatasets, mode);
}
