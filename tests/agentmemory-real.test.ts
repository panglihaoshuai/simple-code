// tests/agentmemory-real.test.ts — Real agentmemory smoke tests
// Only runs when SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE=1
import { describe, test, expect } from "bun:test";

const runSmoke = process.env.SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE === "1";

describe.skipIf(!runSmoke)("Real agentmemory smoke", () => {
  test("agentmemory CLI is available", async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("which", ["agentmemory"], { encoding: "utf-8" });
    expect(r.status).toBe(0);
  });

  test("agentmemory status returns connected", async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("agentmemory", ["status"], { encoding: "utf-8", timeout: 10000 });
    expect(r.stdout).toContain("Connected");
  });

  test("agentmemory HTTP health endpoint responds", async () => {
    const res = await fetch("http://localhost:3111/health");
    expect(res.ok).toBe(true);
    const body = await res.json() as { status: string };
    expect(body.status).toBeDefined();
  });

  test("companion daemon with real provider starts and reports agentmemory status", async () => {
    const { spawn } = await import("bun");
    const { join } = await import("node:path");

    const REPO = join(import.meta.dir, "..");
    const SIMPLE_CODED = join(REPO, "packages", "companion", "src", "simple-coded.ts");
    const PORT = 17111;

    const proc = spawn({
      cmd: ["bun", "run", SIMPLE_CODED],
      env: { ...process.env, SIMPLE_CODE_MEMORY_PORT: String(PORT) },
      stdout: "pipe",
      stderr: "pipe",
    });

    // Wait for daemon to start
    const start = Date.now();
    let healthRes: Response | null = null;
    while (Date.now() - start < 5000) {
      try {
        healthRes = await fetch(`http://localhost:${PORT}/health`);
        if (healthRes.ok) break;
      } catch {
        await Bun.sleep(100);
      }
    }

    expect(healthRes).not.toBeNull();
    const body = await healthRes!.json() as { agentmemory?: { available: boolean; mode: string } };
    expect(body.agentmemory).toBeDefined();
    // Auto mode should pick CLI (agentmemory CLI is on PATH)
    expect(body.agentmemory!.available).toBe(true);

    // Cleanup
    proc.kill("SIGTERM");
    await proc.exited;
  });

  test("companion daemon observe uses HTTP provider (not CLI)", async () => {
    const { spawn } = await import("bun");
    const { join } = await import("node:path");

    const REPO = join(import.meta.dir, "..");
    const SIMPLE_CODED = join(REPO, "packages", "companion", "src", "simple-coded.ts");
    const PORT = 17112;

    const proc = spawn({
      cmd: ["bun", "run", SIMPLE_CODED],
      env: { ...process.env, SIMPLE_CODE_MEMORY_PORT: String(PORT) },
      stdout: "pipe",
      stderr: "pipe",
    });

    // Wait for daemon
    const start = Date.now();
    while (Date.now() - start < 5000) {
      try {
        const r = await fetch(`http://localhost:${PORT}/health`);
        if (r.ok) break;
      } catch {
        await Bun.sleep(100);
      }
    }

    // Send observe — must succeed via HTTP provider
    const observeRes = await fetch(`http://localhost:${PORT}/memory/observe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "smoke.test",
        timestamp: new Date().toISOString(),
        data: { test: true },
      }),
    });

    expect(observeRes.ok).toBe(true);
    const body = await observeRes.json() as { ok: boolean; agentmemory?: { available: boolean; error?: string } };
    expect(body.ok).toBe(true);
    expect(body.agentmemory).toBeDefined();
    // HTTP provider must have actually forwarded — no error
    expect(body.agentmemory!.error).toBeUndefined();
    expect(body.agentmemory!.available).toBe(true);

    // Cleanup
    proc.kill("SIGTERM");
    await proc.exited;
  });
});

describe("Real smoke env gate", () => {
  const isSmoke = process.env.SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE === "1";
  test.skipIf(!isSmoke)("SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE is set for smoke run", () => {
    expect(process.env.SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE).toBe("1");
  });
});
