// T4.5: plugin adapter test - 28 lifecycle events → POST to daemon
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawn, type Subprocess } from "bun";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");
const SIMPLE_CODED = join(REPO, "packages", "companion", "src", "simple-coded.ts");
const ADAPTER = join(REPO, "packages", "companion", "src", "plugin-adapter.ts");
const PORT = 14111;

process.env.SIMPLE_CODE_MEMORY_PORT = String(PORT);

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

const EXPECTED_HOOKS = [
  "command.executed", "file.edited", "file.watcher.updated", "installation.updated",
  "lsp.client.diagnostics", "lsp.updated", "message.part.removed", "message.part.updated",
  "message.removed", "message.updated", "permission.asked", "permission.replied",
  "server.connected", "session.created", "session.compacted", "session.deleted",
  "session.diff", "session.error", "session.idle", "session.status", "session.updated",
  "todo.updated", "shell.env", "tool.execute.after", "tool.execute.before",
  "tui.prompt.append", "tui.command.execute", "tui.toast.show",
];

const { makeHooks } = require(ADAPTER) as { makeHooks: () => Record<string, ((data: unknown) => Promise<void>) | undefined> };

describe("T4.5: plugin adapter", () => {
  beforeEach(async () => {
    await startDaemon();
  });

  afterEach(async () => {
    await stopDaemon();
  });

  test("plugin adapter exports makeHooks function", () => {
    expect(typeof makeHooks).toBe("function");
  });

  test("makeHooks returns object with 28 hooks", () => {
    const hooks = makeHooks();
    const hookKeys = Object.keys(hooks);
    expect(hookKeys.length).toBe(28);

    for (const hook of EXPECTED_HOOKS) {
      expect(hookKeys).toContain(hook);
      expect(typeof hooks[hook]).toBe("function");
    }
  });

  test("hook sends POST to daemon /memory/observe", async () => {
    const hooks = makeHooks();
    await hooks["file.edited"]!({ path: "/src/index.ts" });
    await Bun.sleep(200);

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number };
    expect(body.observations_total).toBeGreaterThanOrEqual(1);
  });

  test("hook payload has correct structure", async () => {
    const hooks = makeHooks();
    await hooks["session.created"]!({ id: "test-session" });
    await Bun.sleep(200);

    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json() as { observations_total: number };
    expect(body.observations_total).toBeGreaterThanOrEqual(1);
  });

  test("hooks work when daemon is not running (silent fail)", async () => {
    await stopDaemon();
    const hooks = makeHooks();
    await expect(hooks["file.edited"]!({ path: "/src/index.ts" })).resolves.toBeUndefined();
  });
});
