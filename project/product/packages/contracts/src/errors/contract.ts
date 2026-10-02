import { z } from 'zod';
import { ErrorCategorySchema } from './category';

/**
 * Base shape of every error contract in the platform.
 *
 * Every error that crosses an IPC boundary (Tauri invoke, WebSocket message,
 * HTTP response) uses this shape. Specific error types extend it.
 *
 * - `code`: machine-readable identifier (e.g., 'PROJECT_NOT_FOUND')
 * - `category`: classification for retry/UI decisions
 * - `message`: human-readable, may be localized in future
 * - `details`: optional structured details (key-value)
 * - `correlationId`: traces back to the originating command/query
 * - `timestamp`: when the error occurred
 */
export const ErrorContractSchema = z.object({
  code: z.string().min(1).max(128),
  category: ErrorCategorySchema,
  message: z.string().min(1).max(2048),
  details: z.record(z.string(), z.unknown()).optional(),
  correlationId: z.string().uuid().optional(),
  timestamp: z.string().datetime(), // ISO 8601
});

export type ErrorContract = z.infer<typeof ErrorContractSchema>;
