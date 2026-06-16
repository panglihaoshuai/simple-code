// tests/doctor.test.ts — simple-code doctor/status tests
import { describe, test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");

function runDoctor(args: string[] = []): { stdout: string; exitCode: number } {
  const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "doctor", ...args], {
    encoding: "utf-8",
    timeout: 30000,
  });
  return { stdout: r.stdout ?? "", exitCode: r.status ?? -1 };
}

describe("simple-code doctor", () => {
  test("doctor runs and produces output", () => {
    const { stdout, exitCode } = runDoctor();
    expect(stdout).toContain("simple-code doctor");
    expect(exitCode).toBe(0);
  });

  test("doctor checks opencode", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("opencode CLI");
  });

  test("doctor checks agentmemory", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("agentmemory");
  });

  test("doctor checks config file", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("config.toml");
  });

  test("doctor checks CodeGraph", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("CodeGraph");
  });

  test("doctor checks UA", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("Understand-Anything");
  });

  test("doctor checks agent-skills", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("agent-skills");
  });

  test("doctor checks MCP", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("MCP");
  });

  test("doctor checks LSP", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("LSP");
  });

  test("doctor checks browser", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("browser");
  });

  test("doctor reports overall status", () => {
    const { stdout } = runDoctor();
    expect(stdout).toMatch(/Overall: (PASS|PARTIAL|FAIL)/);
  });

  test("doctor reports missing tooling", () => {
    const { stdout } = runDoctor();
    // At least some tooling should be missing (UA, agent-skills, browser)
    expect(stdout).toContain("Missing Tooling Report");
  });

  test("doctor reports next actions", () => {
    const { stdout } = runDoctor();
    expect(stdout).toContain("Next Actions");
  });

  test("doctor --json outputs valid JSON", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty("overall");
    expect(parsed).toHaveProperty("checks");
    expect(parsed).toHaveProperty("missingTooling");
    expect(parsed).toHaveProperty("nextActions");
    expect(Array.isArray(parsed.checks)).toBe(true);
  });

  test("doctor --json has structured checks", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    for (const check of parsed.checks) {
      expect(check).toHaveProperty("id");
      expect(check).toHaveProperty("label");
      expect(check).toHaveProperty("status");
      expect(check).toHaveProperty("required");
      expect(check).toHaveProperty("evidence");
      expect(check).toHaveProperty("nextActions");
      expect(["pass", "partial", "missing", "fail", "unknown"]).toContain(check.status);
    }
  });

  test("doctor overall is PARTIAL or FAIL (not PASS yet)", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    // M5-M7 not complete, so overall cannot be PASS
    expect(["PARTIAL", "FAIL"]).toContain(parsed.overall);
  });

  test("agentmemory check is pass on this machine", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    const am = parsed.checks.find((c: { id: string }) => c.id === "agentmemory");
    expect(am).toBeDefined();
    expect(am.status).toBe("pass");
  });

  test("UA check is missing (not vendored)", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    const ua = parsed.checks.find((c: { id: string }) => c.id === "ua");
    expect(ua).toBeDefined();
    expect(ua.status).toBe("missing");
  });

  test("agent-skills check is missing (not vendored)", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    const as = parsed.checks.find((c: { id: string }) => c.id === "agent-skills");
    expect(as).toBeDefined();
    expect(as.status).toBe("missing");
  });

  test("browser check is missing", () => {
    const { stdout } = runDoctor(["--json"]);
    const parsed = JSON.parse(stdout);
    const br = parsed.checks.find((c: { id: string }) => c.id === "browser");
    expect(br).toBeDefined();
    expect(br.status).toBe("missing");
  });
});

describe("simple-code status (alias)", () => {
  test("status command works same as doctor", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "status"], {
      encoding: "utf-8",
      timeout: 30000,
    });
    expect(r.stdout).toContain("simple-code doctor");
    expect(r.status).toBe(0);
  });

  test("status --json outputs valid JSON", () => {
    const r = spawnSync("bun", ["run", join(REPO, "src", "cli.ts"), "status", "--json"], {
      encoding: "utf-8",
      timeout: 30000,
    });
    const parsed = JSON.parse(r.stdout);
    expect(parsed).toHaveProperty("overall");
  });
});
