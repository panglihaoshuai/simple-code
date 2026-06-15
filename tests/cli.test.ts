// Integration test for `simple-code config` CLI subcommand (T2.9)

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI = resolve(process.cwd(), "dist", "cli.js");

let tmpDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  configPath = join(tmpDir, "config.toml");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

function run(args: string[]): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("node", [CLI, ...args], {
    env: { ...process.env, SIMPLE_CODE_CONFIG: configPath },
    encoding: "utf-8",
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    status: r.status ?? -1,
  };
}

describe("simple-code config CLI integration", () => {
  test("--version prints package version", () => {
    const r = run(["--version"]);
    if (r.status !== 0) console.error("STDERR:", r.stderr, "STDOUT:", r.stdout);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("0.1.0");
  });

  test("config path prints config file path", () => {
    const r = run(["config", "path"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(configPath);
  });

  test("config show prints defaults when file is empty", () => {
    const r = run(["config", "show"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("net.release");
    expect(r.stdout).toContain("memory");
    expect(r.stdout).toContain("port = 3111");
  });

  test("config list prints all keys", () => {
    const r = run(["config", "list"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("memory.port = 3111");
    expect(r.stdout).toContain("lsp.rust = true");
  });

  test("config get returns default value when unset", () => {
    const r = run(["config", "get", "memory.port"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("3111");
  });

  test("config get errors on missing key", () => {
    const r = run(["config", "get", "nonexistent.key"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("not found");
  });

  test("config set writes to file", () => {
    const r = run(["config", "set", "memory.port", "4096"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("set memory.port");
    expect(existsSync(configPath)).toBe(true);
    const written = readFileSync(configPath, "utf-8");
    expect(written).toContain("port = 4096");
  });

  test("config set then get round-trips", () => {
    run(["config", "set", "memory.port", "4096"]);
    const r = run(["config", "get", "memory.port"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("4096");
  });

  test("config set coerces boolean", () => {
    run(["config", "set", "lsp.rust", "false"]);
    const r = run(["config", "get", "lsp.rust"]);
    expect(r.stdout.trim()).toBe("false");
  });

  test("config set coerces number", () => {
    run(["config", "set", "memory.port", "3217"]);
    const r = run(["config", "get", "memory.port"]);
    expect(r.stdout.trim()).toBe("3217");
  });

  test("config unset removes key (falls back to default)", () => {
    run(["config", "set", "memory.port", "9999"]);
    expect(run(["config", "get", "memory.port"]).stdout.trim()).toBe("9999");
    const r = run(["config", "unset", "memory.port"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("unset");
    expect(run(["config", "get", "memory.port"]).stdout.trim()).toBe("3111");
  });

  test("config --help prints usage", () => {
    const r = run(["config", "--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("simple-code config");
  });
});
