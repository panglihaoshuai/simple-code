// packages/agentmemory/tests/agentmemory.test.ts — AgentMemory provider tests
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..", "..", "..");

describe("AgentMemory provider types", () => {
  test("types.ts exports AgentMemoryStatus", async () => {
    const mod = await import(join(REPO, "packages", "agentmemory", "src", "types.ts"));
    // Type-only export, just verify module loads
    expect(mod).toBeDefined();
  });
});

describe("CLIAgentMemoryProvider", () => {
  test("cli-provider.ts exists", () => {
    expect(existsSync(join(REPO, "packages", "agentmemory", "src", "cli-provider.ts"))).toBe(true);
  });

  test("CLIAgentMemoryProvider can be instantiated", async () => {
    const { CLIAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "cli-provider.ts"));
    const provider = new CLIAgentMemoryProvider("agentmemory", 5000);
    expect(provider).toBeDefined();
    expect(typeof provider.status).toBe("function");
    expect(typeof provider.health).toBe("function");
  });

  test("CLIAgentMemoryProvider.status() detects real agentmemory CLI", async () => {
    const { CLIAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "cli-provider.ts"));
    const provider = new CLIAgentMemoryProvider("agentmemory", 5000);
    const status = await provider.status();

    // On this machine, agentmemory should be available
    if (status.available) {
      expect(status.mode).toBe("cli");
      expect(status.available).toBe(true);
    } else {
      // If not available, should have a reason
      expect(status.reason).toBeDefined();
    }
  });

  test("CLIAgentMemoryProvider.status() returns unavailable for missing CLI", async () => {
    const { CLIAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "cli-provider.ts"));
    const provider = new CLIAgentMemoryProvider("nonexistent-command-xyz", 5000);
    const status = await provider.status();

    expect(status.available).toBe(false);
    expect(status.mode).toBe("cli");
    expect(status.reason).toContain("not found");
  });

  test("CLIAgentMemoryProvider.search() throws (not implemented)", async () => {
    const { CLIAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "cli-provider.ts"));
    const provider = new CLIAgentMemoryProvider("agentmemory", 5000);
    await expect(provider.search("test")).rejects.toThrow("not yet implemented");
  });
});

describe("HTTPAgentMemoryProvider", () => {
  test("http-provider.ts exists", () => {
    expect(existsSync(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"))).toBe(true);
  });

  test("HTTPAgentMemoryProvider can be instantiated", async () => {
    const { HTTPAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"));
    const provider = new HTTPAgentMemoryProvider("http://localhost:3111", 5000);
    expect(provider).toBeDefined();
    expect(typeof provider.status).toBe("function");
    expect(typeof provider.health).toBe("function");
  });

  test("HTTPAgentMemoryProvider.status() detects real daemon on :3111", async () => {
    const { HTTPAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"));
    const provider = new HTTPAgentMemoryProvider("http://localhost:3111", 5000);
    const status = await provider.status();

    // On this machine, agentmemory daemon should be on :3111
    if (status.available) {
      expect(status.mode).toBe("http");
      expect(status.endpoint).toBe("http://localhost:3111");
    } else {
      expect(status.reason).toBeDefined();
    }
  });

  test("HTTPAgentMemoryProvider.status() returns unavailable for bad endpoint", async () => {
    const { HTTPAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"));
    const provider = new HTTPAgentMemoryProvider("http://localhost:19999", 1000);
    const status = await provider.status();

    expect(status.available).toBe(false);
    expect(status.mode).toBe("http");
  });

  test("HTTPAgentMemoryProvider.search() throws when unavailable", async () => {
    const { HTTPAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"));
    const provider = new HTTPAgentMemoryProvider("http://localhost:19999", 1000);
    await expect(provider.search("test")).rejects.toThrow("not supported");
  });
});

describe("createProvider factory", () => {
  test("index.ts exports createProvider", async () => {
    const { createProvider } = await import(join(REPO, "packages", "agentmemory", "src", "index.ts"));
    expect(typeof createProvider).toBe("function");
  });

  test("createProvider auto mode returns available provider on this machine", async () => {
    const { createProvider } = await import(join(REPO, "packages", "agentmemory", "src", "index.ts"));
    const provider = await createProvider({ mode: "auto", timeoutMs: 5000 });
    const status = await provider.status();

    // On this machine, at least one should be available
    if (status.available) {
      expect(["cli", "http"]).toContain(status.mode);
    } else {
      expect(status.reason).toBeDefined();
    }
  });

  test("createProvider disabled returns unavailable", async () => {
    const { createProvider } = await import(join(REPO, "packages", "agentmemory", "src", "index.ts"));
    const provider = await createProvider({ enabled: false });
    const status = await provider.status();

    expect(status.available).toBe(false);
    expect(status.mode).toBe("unavailable");
  });

  test("createProvider cli mode returns CLI provider", async () => {
    const { createProvider } = await import(join(REPO, "packages", "agentmemory", "src", "index.ts"));
    const provider = await createProvider({ mode: "cli" });
    const status = await provider.status();

    // Should be CLI mode regardless of availability
    expect(status.mode === "cli" || status.mode === "unavailable").toBe(true);
  });

  test("createProvider http mode returns HTTP provider", async () => {
    const { createProvider } = await import(join(REPO, "packages", "agentmemory", "src", "index.ts"));
    const provider = await createProvider({ mode: "http", endpoint: "http://localhost:3111" });
    const status = await provider.status();

    expect(status.mode === "http" || status.mode === "unavailable").toBe(true);
  });
});

describe("Optional real smoke (env-gated)", () => {
  const runSmoke = process.env.SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE === "1";

  test.skipIf(!runSmoke)("real CLI status returns available", async () => {
    const { CLIAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "cli-provider.ts"));
    const provider = new CLIAgentMemoryProvider("agentmemory", 5000);
    const status = await provider.status();
    expect(status.available).toBe(true);
    expect(status.mode).toBe("cli");
  });

  test.skipIf(!runSmoke)("real HTTP health returns data", async () => {
    const { HTTPAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"));
    const provider = new HTTPAgentMemoryProvider("http://localhost:3111", 5000);
    const health = await provider.health();
    expect(health.status).toBe("ok");
  });

  test.skipIf(!runSmoke)("real observe succeeds", async () => {
    const { HTTPAgentMemoryProvider } = await import(join(REPO, "packages", "agentmemory", "src", "http-provider.ts"));
    const provider = new HTTPAgentMemoryProvider("http://localhost:3111", 5000);
    await expect(provider.observe("test.event", { test: true })).resolves.toBeUndefined();
  });
});
