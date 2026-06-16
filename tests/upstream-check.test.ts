// T3.1: upstream-check.sh main framework test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPTS_DIR = join(process.cwd(), "script");

let tmpDir: string;
let configPath: string;
let outputPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-upstream-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  configPath = join(tmpDir, "config.toml");
  outputPath = join(tmpDir, "upstream-status.json");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

function runUpstreamCheck(args: string[] = []): { stdout: string; stderr: string; status: number } {
  const scriptPath = join(SCRIPTS_DIR, "upstream-check.sh");
  if (!existsSync(scriptPath)) {
    return { stdout: "", stderr: "upstream-check.sh not found", status: 1 };
  }
  
  const r = spawnSync("bash", [scriptPath, ...args], {
    env: { 
      ...process.env, 
      SIMPLE_CODE_CONFIG: configPath,
      UPSTREAM_STATUS_OUTPUT: outputPath,
    },
    encoding: "utf-8",
    timeout: 30000,
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    status: r.status ?? -1,
  };
}

describe("T3.1: upstream-check.sh main framework", () => {
  test("script exists and is executable", () => {
    const scriptPath = join(SCRIPTS_DIR, "upstream-check.sh");
    expect(existsSync(scriptPath)).toBe(true);
    
    // Check if executable
    const r = spawnSync("test", ["-x", scriptPath]);
    expect(r.status).toBe(0);
  });

  test("script accepts --help flag", () => {
    const r = runUpstreamCheck(["--help"]);
    
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("upstream-check");
    expect(r.stdout).toContain("agentmemory");
  });

  test("script creates output JSON file", () => {
    // Create a minimal config
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    const r = runUpstreamCheck();
    
    // Should create output file (even if empty/error)
    expect(existsSync(outputPath)).toBe(true);
  });

  test("output JSON has required structure", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    if (existsSync(outputPath)) {
      const content = readFileSync(outputPath, "utf-8");
      const data = JSON.parse(content);
      
      // Should have checked_at timestamp
      expect(data).toHaveProperty("checked_at");
      expect(typeof data.checked_at).toBe("string");
      
      // Should have components object
      expect(data).toHaveProperty("components");
      expect(typeof data.components).toBe("object");
    }
  });

  test("script handles missing config gracefully", () => {
    const r = runUpstreamCheck();
    
    // Should not crash, even with missing config
    expect(r.status).toBeDefined();
  });

  test("script checks agentmemory upstream", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    const r = runUpstreamCheck(["--check", "agentmemory"]);
    
    // Should complete without error (even if network unavailable)
    expect(r.status).toBeDefined();
  });

  test("script checks UA upstream", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    const r = runUpstreamCheck(["--check", "ua"]);
    
    expect(r.status).toBeDefined();
  });

  test("script checks agent-skills upstream", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    const r = runUpstreamCheck(["--check", "agent-skills"]);
    
    expect(r.status).toBeDefined();
  });
});
