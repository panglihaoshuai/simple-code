// T3.9: release.yml workflow test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let workflowPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-release-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  workflowPath = join(tmpDir, "release.yml");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

describe("T3.9: release.yml workflow", () => {
  test("workflow file exists in .github/workflows", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "release.yml");
    
    // This test will fail until we create the workflow
    expect(existsSync(workflowFile)).toBe(true);
  });

  test("workflow has correct name", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "release.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("name: Release");
    }
  });

  test("workflow triggers on workflow_dispatch", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "release.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("workflow_dispatch:");
    }
  });

  test("workflow has breaking field input", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "release.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("breaking:");
    }
  });

  test("workflow runs npm publish", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "release.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("npm publish");
    }
  });

  test("workflow creates GitHub release", () => {
    const workflowDir = join(process.cwd(), ".github", "workflows");
    const workflowFile = join(workflowDir, "release.yml");
    
    if (existsSync(workflowFile)) {
      const content = readFileSync(workflowFile, "utf-8");
      expect(content).toContain("release");
    }
  });
});
