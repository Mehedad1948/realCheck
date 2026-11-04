import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, route } from '@/server/http';
import { getEvaluatorEarnings } from '@/server/services/labeling';

export const GET = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  return Response.json(await getEvaluatorEarnings(evaluator), { headers: PRIVATE_NO_STORE });
});
