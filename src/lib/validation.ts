import { z } from 'zod';
import {
  MAX_OPTIONS,
  MAX_REQUIRED_VOTES,
  MAX_TASK_CONTENT_LENGTH,
  MAX_TOP_UP_CENTS,
  UPLOAD_CHUNK_SIZE,
} from './constants';

// Schemas shared by forms (client) and actions / route handlers (server).
// The server always re-validates: anything a client sends is untrusted.

export const id = z.string().min(1).max(64);

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email.'));

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

// No length rule on login: older accounts were created with a 6 character minimum.
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

const option = z.string().trim().min(1).max(80);

export const createDatasetSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  dataType: z.enum(['TEXT', 'IMAGE']),
  question: z.string().trim().min(3).max(300),
  options: z
    .array(option)
    .min(2, 'Add at least two answer options.')
    .max(MAX_OPTIONS)
    .refine((opts) => new Set(opts).size === opts.length, 'Answer options must be unique.'),
  requiredVotes: z.number().int().min(1).max(MAX_REQUIRED_VOTES),
  rewardCents: z.number().int().min(1).max(10_000),
});
export type CreateDatasetInput = z.input<typeof createDatasetSchema>;

export const updateDatasetSchema = z.discriminatedUnion('field', [
  z.object({ field: z.literal('title'), value: z.string().trim().min(3).max(120) }),
  z.object({ field: z.literal('description'), value: z.string().trim().max(2000) }),
  z.object({ field: z.literal('requiredVotes'), value: z.number().int().min(1).max(MAX_REQUIRED_VOTES) }),
]);
export type UpdateDatasetInput = z.input<typeof updateDatasetSchema>;

export const datasetStatusSchema = z.enum(['ACTIVE', 'PAUSED']);

export const taskRowSchema = z.object({
  content: z.string().trim().min(1).max(MAX_TASK_CONTENT_LENGTH),
  /** When set, the row becomes a golden task with this known answer. */
  correctAnswer: z.string().trim().min(1).max(80).optional(),
});
export const uploadTasksSchema = z.object({
  datasetId: id,
  rows: z.array(taskRowSchema).min(1).max(UPLOAD_CHUNK_SIZE),
});
export type TaskRowInput = z.input<typeof taskRowSchema>;

export const imageUrlSchema = z.url({ protocol: /^https?$/ });

export const voteSchema = z.object({ selection: option });

export const topUpSchema = z.object({
  amountCents: z.number().int().min(100).max(MAX_TOP_UP_CENTS),
});
