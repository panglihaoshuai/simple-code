// T3.10: vendor-sync.yml workflow test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let workflowPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-vendor-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  workflowPath = join(tmpDir, "vendor-sync.yml");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

describe("T3.10: vendor-sync.yml workflow", () => {
  test("workflow file exists in .github/workflows", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "vendor-sync.yml");
    
    // This test will fail until we create the workflow
    expect(existsSync(workflowFile)).toBe(true);
  });

  test("workflow has correct name", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "vendor-sync.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("name: Vendor Sync");
    }
  });

  test("workflow triggers on workflow_dispatch", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "vendor-sync.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("workflow_dispatch:");
    }
  });

  test("workflow has target input", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "vendor-sync.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("target:");
    }
  });

  test("workflow runs vendor-sync script", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "vendor-sync.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      // Workflow uses TypeScript script (vendor-sync.ts) not shell script
      expect(content).toContain("vendor-sync");
    }
  });
});
