// T2.6 test: init writes default China-friendly config with correct mirror sources
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(process.cwd(), "dist", "cli.js");

let tmpDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-init-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  configPath = join(tmpDir, "config.toml");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

function runInit(args: string[] = []): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("node", [CLI, "init", ...args], {
    env: { ...process.env, SIMPLE_CODE_CONFIG: configPath },
    encoding: "utf-8",
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    status: r.status ?? -1,
  };
}

describe("T2.6: init writes default China-friendly config", () => {
  test("init creates config.toml with China-friendly mirrors", () => {
    // RED: This test should fail because init doesn't exist yet
    const r = runInit();
    
    // Config file should be created
    expect(existsSync(configPath)).toBe(true);
    
    // Read the config
    const configContent = readFileSync(configPath, "utf-8");
    
    // Should contain China-friendly mirror URLs
    expect(configContent).toContain("ghproxy.com");
    expect(configContent).toContain("npmmirror.com");
    expect(configContent).toContain("api.openai-proxy.com");
  });

  test("config contains net.release with github_release mirror", () => {
    const r = runInit();
    const configContent = readFileSync(configPath, "utf-8");
    
    // Should have net.release section with github_release pointing to ghproxy
    expect(configContent).toContain("[net.release]");
    expect(configContent).toContain("github_release");
    expect(configContent).toContain("ghproxy.com");
  });

  test("config contains net.lsp with gh-proxy mirror", () => {
    const r = runInit();
    const configContent = readFileSync(configPath, "utf-8");
    
    // Should have net.lsp section
    expect(configContent).toContain("[net.lsp]");
    expect(configContent).toContain("gh-proxy.com");
  });

  test("config contains net.browser with npmmirror", () => {
    const r = runInit();
    const configContent = readFileSync(configPath, "utf-8");
    
    // Should have net.browser section
    expect(configContent).toContain("[net.browser]");
    expect(configContent).toContain("npmmirror.com");
  });

  test("config contains net.llm with openai-proxy", () => {
    const r = runInit();
    const configContent = readFileSync(configPath, "utf-8");
    
    // Should have net.llm section
    expect(configContent).toContain("[net.llm]");
    expect(configContent).toContain("api.openai-proxy.com");
  });
});
