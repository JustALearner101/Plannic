import { describe, it, expect } from "bun:test";
import { withTempWorkspace, seedStressRepo } from "../harness/index.js";
import { listPlans, readPlan, searchPlans, listAdrs, listSpecs } from "../../packages/fs/src/index.js";

describe("Phase 4: Scale, Volume & Performance Benchmark E2E", () => {
  it("should benchmark high-volume repository (50 plans, 100 tasks, 1000-line markdown)", async () => {
    await withTempWorkspace(async (ws) => {
      // 1. Seed high volume stress dataset
      const seedStart = performance.now();
      const { massivePlanSlug, stressPlanSlug } = await seedStressRepo(ws.path, {
        planCount: 50,
        taskCount: 100,
      });
      const seedDuration = performance.now() - seedStart;
      expect(seedDuration).toBeGreaterThan(0);

      // 2. Test listPlans performance across 50 plans
      const listStart = performance.now();
      const plans = await listPlans(ws.path);
      const listDuration = performance.now() - listStart;

      expect(plans.length).toBe(50);
      expect(listDuration).toBeLessThan(300); // Must complete within 300ms

      // 3. Test readPlan performance on massive 1000-line document
      const readStart = performance.now();
      const massivePlan = await readPlan(ws.path, massivePlanSlug);
      const readDuration = performance.now() - readStart;

      expect(massivePlan).not.toBeNull();
      const featureDoc = massivePlan?.documents.find((d) => d.type === "feature");
      expect(featureDoc?.body.length).toBeGreaterThan(10000);
      expect(readDuration).toBeLessThan(100); // Must parse gray-matter within 100ms

      // 4. Test 100+ tasks parsing in stress plan
      const stressPlan = await readPlan(ws.path, stressPlanSlug);
      const phaseDoc = stressPlan?.documents.find((d) => d.type === "phase");
      expect(phaseDoc).toBeDefined();
      const taskMatches = phaseDoc?.body.match(/- \[[ x\/]\]/g);
      expect(taskMatches?.length).toBe(100);

      // 5. Test fuzzy search across 50 plans and massive content
      const searchStart = performance.now();
      const searchResults = await searchPlans(ws.path, "benchmarking audit", 10);
      const searchDuration = performance.now() - searchStart;

      expect(searchDuration).toBeLessThan(200); // Fuzzy search within 200ms

      // 6. Verify ADRs and Specs count
      const adrs = await listAdrs(ws.path);
      expect(adrs.length).toBe(8);

      const specs = await listSpecs(ws.path);
      expect(specs.length).toBe(5);
    });
  });
});
