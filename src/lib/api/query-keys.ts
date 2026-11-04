// Query key factories. Keys are hierarchical so a whole area can be invalidated
// at once, e.g. `queryClient.invalidateQueries({ queryKey: queryKeys.tma.all })`.
export const queryKeys = {
  public: {
    all: ['public'] as const,
    openDatasets: () => [...queryKeys.public.all, 'open-datasets'] as const,
  },
  tma: {
    all: ['tma'] as const,
    me: () => [...queryKeys.tma.all, 'me'] as const,
    earnings: () => [...queryKeys.tma.all, 'earnings'] as const,
    taskBatch: (datasetId: string) => [...queryKeys.tma.all, 'task-batch', datasetId] as const,
  },
};
