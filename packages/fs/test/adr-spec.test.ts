import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  initAdr,
  readAdr,
  listAdrs,
  initSpec,
  readSpec,
  updateSpec,
  listSpecs,
} from "../src/index.js";

describe("ADR and Spec FS Operations", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "plannic-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should auto-increment ADR numbers sequentially", async () => {
    const adr1 = await initAdr(tmpDir, {
      title: "Use Tauri 2 for Desktop App",
      status: "accepted",
      description: "Desktop app architecture choice",
    });

    expect(adr1.number).toBe(1);
    expect(adr1.slug).toBe("use-tauri-2-for-desktop-app");
    expect(adr1.path).toContain("adr-0001-use-tauri-2-for-desktop-app.md");

    const adr2 = await initAdr(tmpDir, {
      title: "Use Bun as Primary Runtime",
      status: "accepted",
    });

    expect(adr2.number).toBe(2);
    expect(adr2.path).toContain("adr-0002-use-bun-as-primary-runtime.md");

    // Read by number
    const read1 = await readAdr(tmpDir, 1);
    expect(read1).not.toBeNull();
    expect(read1?.frontmatter.title).toBe("Use Tauri 2 for Desktop App");
    expect(read1?.frontmatter.status).toBe("accepted");

    // Read by slug
    const read2 = await readAdr(tmpDir, "use-bun-as-primary-runtime");
    expect(read2).not.toBeNull();
    expect(read2?.frontmatter.number).toBe(2);

    // List ADRs
    const adrs = await listAdrs(tmpDir);
    expect(adrs.length).toBe(2);
    expect(adrs[0].number).toBe(1);
    expect(adrs[1].number).toBe(2);
  });

  it("should initialize, update, and list living specifications", async () => {
    const spec = await initSpec(tmpDir, {
      title: "API Contracts",
      category: "api",
      description: "JSON-RPC and MCP specifications",
    });

    expect(spec.slug).toBe("api-contracts");
    expect(spec.path).toContain("api-contracts.md");

    const readInitial = await readSpec(tmpDir, "api-contracts");
    expect(readInitial).not.toBeNull();
    expect(readInitial?.frontmatter.version).toBe("1.0");
    expect(readInitial?.frontmatter.status).toBe("draft");
    expect(readInitial?.frontmatter.category).toBe("api");

    // Update spec
    const updated = await updateSpec(tmpDir, {
      slug: "api-contracts",
      body: "# API Contracts\n\nUpdated body content with endpoints.",
      changeSummary: "Added v1 endpoints",
      status: "living",
    });

    expect(updated.success).toBe(true);
    expect(updated.version).toBe("1.1");

    const readUpdated = await readSpec(tmpDir, "api-contracts");
    expect(readUpdated?.frontmatter.version).toBe("1.1");
    expect(readUpdated?.frontmatter.status).toBe("living");
    expect(readUpdated?.body).toContain("Updated body content");

    // List specs
    const specs = await listSpecs(tmpDir);
    expect(specs.length).toBe(1);
    expect(specs[0].slug).toBe("api-contracts");
    expect(specs[0].status).toBe("living");
  });
});
