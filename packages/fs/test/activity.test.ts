import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  emitAgentActivity,
  readAgentActivity,
  clearAgentActivity,
  getAgentActivityPath,
  initPlan,
  updateDocument,
  moveTask,
} from "../src/index.js";

describe("Agent Activity Stream (.plannic/.agent_activity.json)", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "plannic-activity-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should emit and read agent activity events", async () => {
    const event = await emitAgentActivity(tempDir, {
      agent: "Antigravity",
      action: "move_task",
      status: "executing",
      planSlug: "auth-flow",
      taskId: "task-1",
      taskTitle: "Implement OAuth2 callback",
      fromStatus: "todo",
      toStatus: "in_progress",
    });

    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.agent).toBe("Antigravity");

    const stream = await readAgentActivity(tempDir);
    expect(stream.events.length).toBe(1);
    expect(stream.events[0].action).toBe("move_task");
    expect(stream.activeAgent).toBe("Antigravity");
  });

  it("should retain activeAgent during executing and clear when settled", async () => {
    await emitAgentActivity(tempDir, {
      agent: "Claude",
      action: "move_task",
      status: "executing",
      planSlug: "auth-flow",
      taskTitle: "Setup secrets",
    });

    let stream = await readAgentActivity(tempDir);
    expect(stream.activeAgent).toBe("Claude");

    await emitAgentActivity(tempDir, {
      agent: "Claude",
      action: "move_task",
      status: "completed",
      planSlug: "auth-flow",
      taskTitle: "Setup secrets",
    });

    stream = await readAgentActivity(tempDir);
    expect(stream.activeAgent).toBeUndefined();
  });

  it("should trigger emitAgentActivity when moveTask is called", async () => {
    await initPlan(tempDir, "Payment Gateway", "deep");

    // Put a task in phase-1.md
    await updateDocument(
      tempDir,
      "payment-gateway",
      "phase",
      "## Deliverables\n\n- [ ] Integrate Stripe SDK\n- [ ] Webhook validation\n",
      "Add deliverables"
    );

    const result = await moveTask(
      tempDir,
      "payment-gateway",
      "Stripe SDK",
      "in_progress",
      undefined,
      "Starting SDK integration",
      "Antigravity"
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("in_progress");

    const stream = await readAgentActivity(tempDir);
    expect(stream.events.length).toBeGreaterThan(0);
    const lastEvent = stream.events[stream.events.length - 1];
    expect(lastEvent.action).toBe("move_task");
    expect(lastEvent.agent).toBe("Antigravity");
    expect(lastEvent.taskTitle).toBe("Integrate Stripe SDK");
    expect(lastEvent.toStatus).toBe("in_progress");
  });

  it("should clear activity file successfully", async () => {
    await emitAgentActivity(tempDir, {
      action: "custom",
      status: "executing",
      planSlug: "demo",
    });

    const activityPath = getAgentActivityPath(tempDir);
    expect(await fs.exists(activityPath)).toBe(true);

    await clearAgentActivity(tempDir);
    expect(await fs.exists(activityPath)).toBe(false);
  });
});
