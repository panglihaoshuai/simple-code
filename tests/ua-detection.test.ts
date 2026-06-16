// T3.3: Understand-Anything upstream detection test
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
  tmpDir = join(tmpdir(), `simple-code-ua-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

describe("T3.3: Understand-Anything upstream detection", () => {
  test("check UA component exists in output", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "ua"]);
    
    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    expect(data.components).toHaveProperty("understand_anything");
  });

  test("UA has current version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "ua"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.understand_anything).toHaveProperty("current");
    expect(typeof data.components.understand_anything.current).toBe("string");
  });

  test("UA has latest version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "ua"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.understand_anything).toHaveProperty("latest");
    expect(typeof data.components.understand_anything.latest).toBe("string");
  });

  test("UA has delta field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "ua"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.understand_anything).toHaveProperty("delta");
  });

  test("UA has must_release field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "ua"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.understand_anything).toHaveProperty("must_release");
    expect(typeof data.components.understand_anything.must_release).toBe("boolean");
  });

  test("UA current version is unknown when not vendored", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "ua"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    // UA is not vendored yet, so current should be "unknown"
    expect(data.components.understand_anything.current).toBe("unknown");
  });
});
