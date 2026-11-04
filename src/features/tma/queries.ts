'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { EvaluatorProfile, OpenDataset, TaskBatch, VoteResult } from '@/lib/api/types';
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
    },
  });
}
