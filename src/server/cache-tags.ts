// Every cache tag in one place, so writes invalidate exactly what reads tagged.
export const tags = {
  /** Public list of datasets open for labeling. */
  openDatasets: 'datasets:open',
  /** Anything derived from a single dataset (public view and the owner's view). */
  dataset: (datasetId: string) => `dataset:${datasetId}`,
  /** An owner's dataset list and stats on the dashboard. */
  ownerDatasets: (ownerId: string) => `owner:${ownerId}:datasets`,
  platformStats: 'stats:platform',
};
