import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  initPlan,
  readPlan,
  updateDocument,
  moveTask,
  addPhase,
  checkPhaseGate,
  advancePhase,
  getExecutionProgress,
} from "../src/index.js";

describe("Multi-Phase Long-Running Execution Engine (ADR #0002)", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "plannic-phase-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should add a sequential phase-2.md to a hierarchical plan", async () => {
    await initPlan(tempDir, "Search Engine", "deep");

    const result = await addPhase(tempDir, {
      cwd: tempDir,
      slug: "search-engine",
      title: "Phase 2: Vector Indexing",
      deliverables: ["Setup Qdrant instance", "Generate embeddings pipeline"],
    });

    expect(result.success).toBe(true);
    expect(result.phaseNumber).toBe(2);
    expect(result.phaseSlug).toBe("phase-2");

    const phase2Path = path.join(tempDir, ".docs", "plans", "search-engine", "phase-2.md");
    expect(await fs.exists(phase2Path)).toBe(true);

    const plan = await readPlan(tempDir, "search-engine");
    expect(plan).toBeDefined();
    expect(plan?.documents.some((d) => d.path.includes("phase-2.md"))).toBe(true);
  });

  it("should enforce phase gates during advancePhase", async () => {
    await initPlan(tempDir, "Cloud Storage", "deep");

    // Put incomplete deliverables in phase-1
    await updateDocument(
      tempDir,
      "cloud-storage",
      "phase",
      "## Deliverables\n\n- [ ] Create S3 bucket\n- [ ] Configure CORS policy\n",
      "Add phase 1 tasks"
    );

    // Gate should be blocked
    const gate1 = await checkPhaseGate(tempDir, "cloud-storage", 1);
    expect(gate1.allTasksCompleted).toBe(false);
    expect(gate1.status).toBe("blocked");
    expect(gate1.uncompletedTasks.length).toBe(2);

    // advancePhase should fail without force
    const advanceResult1 = await advancePhase(tempDir, {
      cwd: tempDir,
      slug: "cloud-storage",
      force: false,
    });
    expect(advanceResult1.success).toBe(false);
    expect(advanceResult1.gatePassed).toBe(false);
    expect(advanceResult1.currentPhase).toBe(1);

    // Complete all tasks in phase-1
    await moveTask(tempDir, "cloud-storage", "Create S3 bucket", "done");
    await moveTask(tempDir, "cloud-storage", "Configure CORS policy", "done");

    const gate2 = await checkPhaseGate(tempDir, "cloud-storage", 1);
    expect(gate2.allTasksCompleted).toBe(true);
    expect(gate2.status).toBe("passed");

    // advancePhase should now succeed
    const advanceResult2 = await advancePhase(tempDir, {
      cwd: tempDir,
      slug: "cloud-storage",
    });
    expect(advanceResult2.success).toBe(true);
    expect(advanceResult2.currentPhase).toBe(2);

    const updatedPlan = await readPlan(tempDir, "cloud-storage");
    expect((updatedPlan?.root.frontmatter as any).activePhase).toBe(2);
  });

  it("should allow bypassing gate with force: true", async () => {
    await initPlan(tempDir, "Pipeline", "deep");

    await updateDocument(
      tempDir,
      "pipeline",
      "phase",
      "## Deliverables\n\n- [ ] Pending task\n",
      "Phase 1 task"
    );

    const forcedResult = await advancePhase(tempDir, {
      cwd: tempDir,
      slug: "pipeline",
      force: true,
      comment: "Hotfix bypass",
    });

    expect(forcedResult.success).toBe(true);
    expect(forcedResult.currentPhase).toBe(2);
  });

  it("should calculate execution progress across multiple phases accurately", async () => {
    await initPlan(tempDir, "Analytics Dashboard", "deep");

    // Phase 1: 2 tasks, 2 completed (100%)
    await updateDocument(
      tempDir,
      "analytics-dashboard",
      "phase",
      "## Deliverables\n\n- [x] Setup DuckDB\n- [x] Create parquet exporter\n",
      "Complete phase 1"
    );

    // Phase 2: 2 tasks, 1 completed (50%)
    await addPhase(tempDir, {
      cwd: tempDir,
      slug: "analytics-dashboard",
      title: "Phase 2: Visualization",
      deliverables: ["Build chart components", "Export CSV reports"],
    });

    await moveTask(tempDir, "analytics-dashboard", "Build chart components", "done");

    const progress = await getExecutionProgress(tempDir, "analytics-dashboard");
    expect(progress.totalPhases).toBe(2);
    expect(progress.phases.length).toBe(2);

    // Phase 1
    expect(progress.phases[0].percentage).toBe(100);
    expect(progress.phases[0].isCompleted).toBe(true);

    // Phase 2
    expect(progress.phases[1].percentage).toBe(50);
    expect(progress.phases[1].isCompleted).toBe(false);

    // Aggregate: 3 done out of 4 = 75%
    expect(progress.aggregatePercentage).toBe(75);
  });
});
