import { id } from '@/lib/validation';
import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, parseParam, route } from '@/server/http';
import { getEvaluatorDatasetHistory } from '@/server/services/history';

export const GET = route<{ datasetId: string }>(async (request, { params }) => {
  const datasetId = parseParam((await params).datasetId, id);
  const { evaluator } = await requireEvaluator(request);
  return Response.json(await getEvaluatorDatasetHistory(evaluator, datasetId), { headers: PRIVATE_NO_STORE });
});
