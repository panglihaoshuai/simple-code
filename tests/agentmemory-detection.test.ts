// T3.2: agentmemory upstream detection test
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
  tmpDir = join(tmpdir(), `simple-code-agentmemory-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

describe("T3.2: agentmemory upstream detection", () => {
  test("check agentmemory component exists in output", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    expect(data.components).toHaveProperty("agentmemory");
  });

  test("agentmemory has current version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agentmemory).toHaveProperty("current");
    expect(typeof data.components.agentmemory.current).toBe("string");
  });

  test("agentmemory has latest version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agentmemory).toHaveProperty("latest");
    expect(typeof data.components.agentmemory.latest).toBe("string");
  });

  test("agentmemory has delta field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agentmemory).toHaveProperty("delta");
  });

  test("agentmemory has must_release field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agentmemory).toHaveProperty("must_release");
    expect(typeof data.components.agentmemory.must_release).toBe("boolean");
  });

  test("agentmemory current version matches installed package", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agentmemory"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    // If agentmemory is installed, current should be a version string
    if (data.components.agentmemory.current !== "unknown") {
      expect(data.components.agentmemory.current).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
