import { z } from "zod";

export const AgentActivityActionSchema = z.enum([
  "move_task",
  "add_phase",
  "advance_phase",
  "update_document",
  "init_plan",
  "custom",
]);
export type AgentActivityAction = z.infer<typeof AgentActivityActionSchema>;

export const AgentActivityStatusSchema = z.enum([
  "executing",
  "completed",
  "failed",
]);
export type AgentActivityStatus = z.infer<typeof AgentActivityStatusSchema>;

export const AgentActivityEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  agent: z.string().default("Antigravity"),
  action: AgentActivityActionSchema,
  status: AgentActivityStatusSchema.default("executing"),
  planSlug: z.string().min(1),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  fromStatus: z.string().optional(),
  toStatus: z.string().optional(),
  phaseSlug: z.string().optional(),
  comment: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AgentActivityEvent = z.infer<typeof AgentActivityEventSchema>;

export const AgentActivityStreamSchema = z.object({
  events: z.array(AgentActivityEventSchema).default([]),
  lastUpdated: z.string(),
  activeAgent: z.string().optional(),
});
export type AgentActivityStream = z.infer<typeof AgentActivityStreamSchema>;
