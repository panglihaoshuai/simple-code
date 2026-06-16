import { z } from "zod";

// Observe payload schema — matches agentmemory observe API
export const ObservePayloadSchema = z.object({
  event: z.string(),                    // opencode event name (e.g. "session.idle")
  timestamp: z.string().datetime(),     // ISO timestamp
  session_id: z.string().optional(),    // opencode session ID
  project: z.string().optional(),       // cwd / project name
  data: z.unknown(),                    // event-specific payload (message content, file path, tool call, etc.)
});

export type ObservePayload = z.infer<typeof ObservePayloadSchema>;

// Health response
export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  port: z.number(),
  uptime_s: z.number(),
  observations_total: z.number(),
  last_observe_at: z.string().datetime().nullable(),
  error: z.string().optional(),
  agentmemory: z.object({
    available: z.boolean(),
    mode: z.string(),
    version: z.string().optional(),
    endpoint: z.string().optional(),
    reason: z.string().optional(),
  }).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
