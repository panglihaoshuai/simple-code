// T3.7: upstream-status.json output test
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
  tmpDir = join(tmpdir(), `simple-code-status-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  configPath = join(tmpDir, "config.toml");
  outputPath = join(tmpDir, "upstream-status.json");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

function runUpstreamCheck(args: string[] = []): { stdout: string; stderr: string; status: number } {
  const scriptPath = join(SCRIPTS_DIR, "upstream-check.sh");
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

describe("T3.7: upstream-status.json output", () => {
  test("output file is valid JSON", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    expect(existsSync(outputPath)).toBe(true);
    
    // Should parse without error
    const content = readFileSync(outputPath, "utf-8");
    const data = JSON.parse(content);
    expect(data).toBeDefined();
  });

  test("output has checked_at timestamp", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data).toHaveProperty("checked_at");
    expect(typeof data.checked_at).toBe("string");
    
    // Should be ISO format
    expect(data.checked_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test("output has triggers_fired array", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data).toHaveProperty("triggers_fired");
    expect(Array.isArray(data.triggers_fired)).toBe(true);
  });

  test("output has components object", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data).toHaveProperty("components");
    expect(typeof data.components).toBe("object");
  });

  test("output has recommendation field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data).toHaveProperty("recommendation");
    expect(typeof data.recommendation).toBe("string");
  });

  test("output has recommendation_reason field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck();
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data).toHaveProperty("recommendation_reason");
    expect(typeof data.recommendation_reason).toBe("string");
  });

  test("output includes all components when --check all", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "all"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    expect(data.components).toHaveProperty("agentmemory");
    expect(data.components).toHaveProperty("understand_anything");
    expect(data.components).toHaveProperty("agent_skills");
    expect(data.components).toHaveProperty("lsp");
    expect(data.components).toHaveProperty("playwright");
  });

  test("output has correct structure for each component", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    // Each component should have current, latest, delta, must_release
    const component = data.components.agentmemory;
    expect(component).toHaveProperty("current");
    expect(component).toHaveProperty("latest");
    expect(component).toHaveProperty("delta");
    expect(component).toHaveProperty("must_release");
  });
});
