// T4.6: E2E test - opencode session → agentmemory observe → recall
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawn, type Subprocess } from "bun";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");
const SIMPLE_CODED = join(REPO, "packages", "companion", "src", "simple-coded.ts");
const PORT = 16111; // unique port to avoid conflict

let proc: Subprocess | null = null;

async function startDaemon(): Promise<string> {
  proc = spawn({
    cmd: ["bun", "run", SIMPLE_CODED],
    env: { ...process.env, SIMPLE_CODE_MEMORY_PORT: String(PORT) },
    stdout: "pipe",
    stderr: "pipe",
  });
  const start = Date.now();
  while (Date.now() - start < 5000) {
    try {
      const res = await fetch(`http://localhost:${PORT}/health`);
      if (res.ok) return `http://localhost:${PORT}`;
    } catch {
      await Bun.sleep(100);
    }
  }
  throw new Error("simple-coded failed to start within 5s");
}

async function stopDaemon(): Promise<void> {
  if (proc) {
    proc.kill("SIGTERM");
    await proc.exited;
    proc = null;
  }
}

// Direct fetch helper (bypass module cache issues)
async function observe(event: string, data: unknown): Promise<void> {
  await fetch(`http://localhost:${PORT}/memory/observe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, timestamp: new Date().toISOString(), data }),
  }).catch(() => {});
}

describe("T4.6: E2E - full session lifecycle", () => {
  beforeEach(async () => {
    await startDaemon();
  });

  afterEach(async () => {
    await stopDaemon();
  });

  test("full session lifecycle: create → edit → idle → health check", async () => {
    await observe("session.created", { id: "e2e-session-1", project: "simple-code" });
    await observe("file.edited", { path: "/src/index.ts", content: "// new code" });
    await observe("tool.execute.after", { name: "bun", exitCode: 0 });
    await observe("session.idle", { id: "e2e-session-1" });

    await Bun.sleep(300);

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number; last_observe_at: string | null };
    expect(body.observations_total).toBe(4);
    expect(body.last_observe_at).toBeTruthy();
  });

  test("multiple sessions are tracked independently", async () => {
    await observe("session.created", { id: "session-a" });
    await observe("session.created", { id: "session-b" });

    await Bun.sleep(200);

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number };
    expect(body.observations_total).toBe(2);
  });

  test("observe endpoint accepts all event types", async () => {
    const events = [
      "command.executed", "file.edited", "session.created",
      "tool.execute.after", "tui.command.execute", "lsp.client.diagnostics",
    ];

    for (const event of events) {
      await observe(event, { test: true, event });
    }

    await Bun.sleep(300);

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number };
    expect(body.observations_total).toBe(events.length);
  });

  test("daemon survives rapid fire observations", async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(observe("file.edited", { path: `/src/file-${i}.ts` }));
    }
    await Promise.all(promises);
    await Bun.sleep(500);

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number };
    expect(body.observations_total).toBe(50);
  });

  test("daemon restart preserves no state (stateless)", async () => {
    await observe("session.created", { id: "before-restart" });
    await Bun.sleep(200);

    await stopDaemon();
    await startDaemon();

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number };
    expect(body.observations_total).toBe(0);
  });
});
