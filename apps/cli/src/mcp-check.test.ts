import { describe, expect, it } from "bun:test";
import { runMcpCheck } from "./mcp-check.js";

describe("mcp-check", () => {
  it("successfully connects and lists registered tools", async () => {
    const result = await runMcpCheck(process.cwd(), 10000);
    expect(result.success).toBe(true);
    expect(result.serverName).toBe("plannic");
    expect(result.toolCount).toBeGreaterThanOrEqual(19);
    expect(result.tools).toContain("get_config");
    expect(result.tools).toContain("init_plan");
    expect(result.tools).toContain("move_task");
    expect(result.tools).toContain("list_adrs");
    expect(result.tools).toContain("list_specs");
  });
});
