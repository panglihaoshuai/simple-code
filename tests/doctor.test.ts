// tests/doctor.test.ts — simple-code doctor tests
import { describe, test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");

describe("simple-code doctor", () => {
  test("doctor command runs and produces output", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor"], {
      encoding: "utf-8",
      timeout: 15000,
      env: { ...process.env, HOME: process.env.HOME },
    });
    expect(r.stdout).toContain("simple-code doctor");
    expect(r.stdout).toContain("PASS");
  });

  test("doctor checks opencode", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor"], {
      encoding: "utf-8",
      timeout: 15000,
    });
    expect(r.stdout).toContain("opencode");
  });

  test("doctor checks agentmemory", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor"], {
      encoding: "utf-8",
      timeout: 15000,
    });
    expect(r.stdout).toContain("agentmemory");
  });

  test("doctor checks config file", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor"], {
      encoding: "utf-8",
      timeout: 15000,
    });
    expect(r.stdout).toContain("config");
  });

  test("doctor reports summary", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor"], {
      encoding: "utf-8",
      timeout: 15000,
    });
    expect(r.stdout).toMatch(/Summary: \d+ PASS/);
  });

  test("doctor checks CodeGraph, UA, agent-skills, MCP, LSP", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor"], {
      encoding: "utf-8",
      timeout: 15000,
    });
    expect(r.stdout).toContain("CodeGraph");
    expect(r.stdout).toContain("Understand-Anything");
    expect(r.stdout).toContain("agent-skills");
    expect(r.stdout).toContain("MCP");
    expect(r.stdout).toContain("LSP");
  });
});
