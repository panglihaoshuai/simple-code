// T3.4: agent-skills upstream detection test
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
  tmpDir = join(tmpdir(), `simple-code-agent-skills-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

describe("T3.4: agent-skills upstream detection", () => {
  test("check agent-skills component exists in output", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agent-skills"]);
    
    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    expect(data.components).toHaveProperty("agent_skills");
  });

  test("agent-skills has current version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agent-skills"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agent_skills).toHaveProperty("current");
    expect(typeof data.components.agent_skills.current).toBe("string");
  });

  test("agent-skills has latest version field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agent-skills"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agent_skills).toHaveProperty("latest");
    expect(typeof data.components.agent_skills.latest).toBe("string");
  });

  test("agent-skills has delta field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agent-skills"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agent_skills).toHaveProperty("delta");
  });

  test("agent-skills has must_release field", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agent-skills"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.agent_skills).toHaveProperty("must_release");
    expect(typeof data.components.agent_skills.must_release).toBe("boolean");
  });

  test("agent-skills current version is unknown when not vendored", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "agent-skills"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    // agent-skills is not vendored yet, so current should be "unknown"
    expect(data.components.agent_skills.current).toBe("unknown");
  });
});
