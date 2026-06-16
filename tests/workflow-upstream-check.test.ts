// T3.8: upstream-check.yml workflow test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let workflowPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-workflow-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  workflowPath = join(tmpDir, "upstream-check.yml");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

describe("T3.8: upstream-check.yml workflow", () => {
  test("workflow file exists in .github/workflows", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "upstream-check.yml");
    
    // This test will fail until we create the workflow
    expect(existsSync(workflowFile)).toBe(true);
  });

  test("workflow has correct name", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "upstream-check.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("name: Upstream Check");
    }
  });

  test("workflow triggers on schedule", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "upstream-check.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("schedule:");
      expect(content).toContain("cron:");
    }
  });

  test("workflow runs upstream-check.sh script", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "upstream-check.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("upstream-check.sh");
    }
  });

  test("workflow uploads upstream-status.json as artifact", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "upstream-check.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("upstream-status.json");
    }
  });
});
