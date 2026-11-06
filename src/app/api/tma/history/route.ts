import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, route } from '@/server/http';
import { getEvaluatorHistory } from '@/server/services/history';

export const GET = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  return Response.json(await getEvaluatorHistory(evaluator), { headers: PRIVATE_NO_STORE });
});
