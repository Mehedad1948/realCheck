import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, route } from '@/server/http';
import { getOpenTaskCounts } from '@/server/services/history';

/** What is left for this evaluator in each open dataset. The public list can't know. */
export const GET = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  return Response.json(await getOpenTaskCounts(evaluator), { headers: PRIVATE_NO_STORE });
});
