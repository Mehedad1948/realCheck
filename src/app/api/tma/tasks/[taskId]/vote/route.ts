import { id, voteSchema } from '@/lib/validation';
import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, parseBody, parseParam, route } from '@/server/http';
import { submitVote } from '@/server/services/labeling';

export const POST = route<{ taskId: string }>(async (request, { params }) => {
  const taskId = parseParam((await params).taskId, id);
  const { evaluator } = await requireEvaluator(request);
  const { selection } = await parseBody(request, voteSchema);
  return Response.json(await submitVote(evaluator, taskId, selection), { headers: PRIVATE_NO_STORE });
});
