import { id } from '@/lib/validation';
import { requireClient } from '@/server/auth/dal';
import { prisma } from '@/server/db';
import { errors } from '@/server/errors';
import { parseParam, route } from '@/server/http';

// Streams labeling results so large datasets don't have to fit in memory or in a
// Server Action response. Authenticated with the dashboard session cookie.

const PAGE_SIZE = 1000;

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? '' : String(value);
  // Stop spreadsheet apps from evaluating cells as formulas.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const GET = route<{ datasetId: string }>(async (request, { params }) => {
  const datasetId = parseParam((await params).datasetId, id);
  const format = new URL(request.url).searchParams.get('format') === 'json' ? 'json' : 'csv';
  const viewer = await requireClient();

  const dataset = await prisma.dataset.findFirst({
    where: { id: datasetId, ownerId: viewer.id },
    select: { title: true, options: true, dataType: true },
  });
  if (!dataset) throw errors.notFound('Dataset not found.');

  const { options } = dataset;
  const encoder = new TextEncoder();

  async function* rows() {
    let cursor: string | undefined;
    while (true) {
      const tasks = await prisma.task.findMany({
        where: { datasetId, isValidation: false },
        orderBy: { id: 'asc' },
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          content: true,
          imageUrls: true,
          status: true,
          collectedVotes: true,
          consensusLabel: true,
          agreement: true,
          confidence: true,
          votes: { select: { selection: true } },
        },
      });
      for (const task of tasks) {
        const counts = Object.fromEntries(options.map((option) => [option, 0]));
        for (const vote of task.votes) counts[vote.selection] = (counts[vote.selection] ?? 0) + 1;
        yield {
          taskId: task.id,
          content: task.content,
          imageUrl: task.imageUrls[0] ?? null,
          status: task.status,
          votes: task.collectedVotes,
          consensusLabel: task.consensusLabel,
          agreement: task.agreement,
          confidence: task.confidence,
          voteCounts: counts,
        };
      }
      if (tasks.length < PAGE_SIZE) return;
      cursor = tasks[tasks.length - 1].id;
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (format === 'csv') {
          const header = ['task_id', 'content', 'image_url', 'status', 'votes', 'consensus_label', 'agreement', 'confidence', ...options.map((o) => `votes_${o}`)];
          controller.enqueue(encoder.encode(header.map(csvCell).join(',') + '\n'));
          for await (const row of rows()) {
            const cells = [row.taskId, row.content, row.imageUrl, row.status, row.votes, row.consensusLabel, row.agreement, row.confidence, ...options.map((o) => row.voteCounts[o])];
            controller.enqueue(encoder.encode(cells.map(csvCell).join(',') + '\n'));
          }
        } else {
          controller.enqueue(encoder.encode('['));
          let first = true;
          for await (const row of rows()) {
            controller.enqueue(encoder.encode((first ? '\n' : ',\n') + JSON.stringify(row)));
            first = false;
          }
          controller.enqueue(encoder.encode('\n]\n'));
        }
        controller.close();
      } catch (error) {
        console.error('[export] failed', error);
        controller.error(error);
      }
    },
  });

  const slug = dataset.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase() || 'dataset';
  const date = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}_${date}.${format}"`,
      'Cache-Control': 'private, no-store',
    },
  });
});
