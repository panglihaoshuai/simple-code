// T3.6: playwright + chromium upstream detection test
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
  tmpDir = join(tmpdir(), `simple-code-playwright-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

describe("T3.6: playwright + chromium upstream detection", () => {
  test("check playwright component exists in output", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    expect(data.components).toHaveProperty("playwright");
  });

  test("playwright has current version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.playwright).toHaveProperty("current");
    expect(typeof data.components.playwright.current).toBe("string");
  });

  test("playwright has latest version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.playwright).toHaveProperty("latest");
    expect(typeof data.components.playwright.latest).toBe("string");
  });

  test("playwright has delta field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.playwright).toHaveProperty("delta");
  });

  test("playwright has must_release field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.playwright).toHaveProperty("must_release");
    expect(typeof data.components.playwright.must_release).toBe("boolean");
  });

  test("playwright has binary_size_delta_pct field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.playwright).toHaveProperty("binary_size_delta_pct");
  });

  test("playwright current version is unknown when not installed", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "playwright"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    // Playwright is not installed yet, so current should be "unknown"
    expect(data.components.playwright.current).toBe("unknown");
  });
});
