'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type {
  DatasetHistory,
  Earnings,
  EvaluatorProfile,
  HistoryDataset,
  OpenDataset,
  OpenTaskCounts,
  TaskBatch,
  VoteResult,
} from '@/lib/api/types';
import { useTelegram } from './telegram-provider';

export function useOpenDatasets(initialData?: OpenDataset[]) {
  return useQuery({
    queryKey: queryKeys.public.openDatasets(),
    queryFn: ({ signal }) => api<OpenDataset[]>('/api/public/datasets', { signal }),
    initialData,
    staleTime: 60_000,
  });
}

export function useMe() {
  const { canAuthenticate } = useTelegram();
  return useQuery({
    queryKey: queryKeys.tma.me(),
    queryFn: ({ signal }) => api<EvaluatorProfile>('/api/tma/me', { signal }),
    enabled: canAuthenticate,
  });
}

export function useEarnings() {
  const { canAuthenticate } = useTelegram();
  return useQuery({
    queryKey: queryKeys.tma.earnings(),
    queryFn: ({ signal }) => api<Earnings>('/api/tma/earnings', { signal }),
    enabled: canAuthenticate,
  });
}

/** The viewer's own remaining count per open dataset, to hide what they've finished. */
export function useOpenTaskCounts() {
  const { canAuthenticate } = useTelegram();
  return useQuery({
    queryKey: queryKeys.tma.openTaskCounts(),
    queryFn: ({ signal }) => api<OpenTaskCounts>('/api/tma/open-task-counts', { signal }),
    enabled: canAuthenticate,
  });
}

export function useHistory() {
  const { canAuthenticate } = useTelegram();
  return useQuery({
    queryKey: queryKeys.tma.history.all(),
    queryFn: ({ signal }) => api<HistoryDataset[]>('/api/tma/history', { signal }),
    enabled: canAuthenticate,
  });
}

export function useDatasetHistory(datasetId: string) {
  const { canAuthenticate } = useTelegram();
  return useQuery({
    queryKey: queryKeys.tma.history.dataset(datasetId),
    queryFn: ({ signal }) => api<DatasetHistory>(`/api/tma/history/${datasetId}`, { signal }),
    enabled: canAuthenticate,
  });
}

export function useTaskBatch(datasetId: string) {
  const { canAuthenticate } = useTelegram();
  return useQuery({
    queryKey: queryKeys.tma.taskBatch(datasetId),
    queryFn: ({ signal }) => api<TaskBatch>(`/api/tma/datasets/${datasetId}/tasks`, { signal }),
    enabled: canAuthenticate,
    // A batch is a unit of work; don't swap tasks out from under the evaluator.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSubmitVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, selection }: { taskId: string; selection: string }) =>
      api<VoteResult>(`/api/tma/tasks/${taskId}/vote`, { method: 'POST', json: { selection } }),
    onSuccess: (result) => {
      queryClient.setQueryData<EvaluatorProfile>(queryKeys.tma.me(), (me) =>
        me ? { ...me, balanceCents: result.balanceCents, tasksDone: me.tasksDone + 1 } : me,
      );
      // Refetched the next time the screens that show them are opened.
      for (const queryKey of [queryKeys.tma.earnings(), queryKeys.tma.openTaskCounts(), queryKeys.tma.history.all()]) {
        queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
      }
    },
  });
}
