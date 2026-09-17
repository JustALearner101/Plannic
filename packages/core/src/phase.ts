import { z } from "zod";

export const PhaseGateStatusSchema = z.enum(["pending", "passed", "blocked"]);
export type PhaseGateStatus = z.infer<typeof PhaseGateStatusSchema>;

export const PhaseGateSchema = z.object({
  phaseNumber: z.number().int().positive(),
  phaseSlug: z.string().min(1),
  totalTasks: z.number().int().nonnegative(),
  completedTasks: z.number().int().nonnegative(),
  allTasksCompleted: z.boolean(),
  status: PhaseGateStatusSchema,
  uncompletedTasks: z.array(z.string()).default([]),
});
export type PhaseGate = z.infer<typeof PhaseGateSchema>;

export const PhaseProgressSchema = z.object({
  phaseNumber: z.number().int().positive(),
  phaseSlug: z.string().min(1),
  title: z.string().min(1),
  isCurrent: z.boolean(),
  isCompleted: z.boolean(),
  totalTasks: z.number().int().nonnegative(),
  completedTasks: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});
export type PhaseProgress = z.infer<typeof PhaseProgressSchema>;

export const AddPhaseInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan"),
  title: z.string().optional().describe("Optional phase title (e.g. 'Phase 2: Database Layer')"),
  deliverables: z.array(z.string()).optional().describe("List of initial checklist tasks for this phase"),
});
export type AddPhaseInput = z.infer<typeof AddPhaseInputSchema>;

export const AddPhaseOutputSchema = z.object({
  success: z.boolean(),
  phaseNumber: z.number(),
  phaseSlug: z.string(),
  filePath: z.string(),
});
export type AddPhaseOutput = z.infer<typeof AddPhaseOutputSchema>;

export const AdvancePhaseInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan"),
  force: z.boolean().optional().default(false).describe("If true, bypasses the gate check when incomplete tasks remain"),
  comment: z.string().optional().describe("Optional explanation for advancing the phase"),
});
export type AdvancePhaseInput = z.infer<typeof AdvancePhaseInputSchema>;

export const AdvancePhaseOutputSchema = z.object({
  success: z.boolean(),
  previousPhase: z.number(),
  currentPhase: z.number(),
  gatePassed: z.boolean(),
  message: z.string(),
});
export type AdvancePhaseOutput = z.infer<typeof AdvancePhaseOutputSchema>;

export const GetExecutionProgressInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan"),
});
export type GetExecutionProgressInput = z.infer<typeof GetExecutionProgressInputSchema>;

export const GetExecutionProgressOutputSchema = z.object({
  planSlug: z.string(),
  activePhase: z.number(),
  totalPhases: z.number(),
  aggregatePercentage: z.number(),
  phases: z.array(PhaseProgressSchema),
});
export type GetExecutionProgressOutput = z.infer<typeof GetExecutionProgressOutputSchema>;
