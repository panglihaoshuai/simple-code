// simple-coded daemon — Bun HTTP server wrapping agentmemory observe API
// Listens on :3111 (default, port-avoidance to 3112-3119 if occupied)
// POST /memory/observe — receive event payload, forward to agentmemory
// GET  /health         — daemon status

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ObservePayloadSchema, type HealthResponse } from "./types.js";
import { loadConfig } from "./config-bridge.js";
import { createProvider, type AgentMemoryProvider, type AgentMemoryStatus } from "../../agentmemory/src/index.js";

const PORT_RANGE_START = parseInt(process.env.SIMPLE_CODE_MEMORY_PORT || "3111", 10);
const PORT_RANGE_END = parseInt(process.env.SIMPLE_CODE_MEMORY_PORT_RANGE_END || "3119", 10);

// ─── State ───

const state = {
  port: PORT_RANGE_START,
  startedAt: Date.now(),
  observationsTotal: 0,
  lastObserveAt: null as string | null,
  agentmemoryStatus: null as AgentMemoryStatus | null,
  provider: null as AgentMemoryProvider | null,        // for status/health (auto)
  observeProvider: null as AgentMemoryProvider | null,  // for observe (HTTP only — CLI can't observe)
};

// ─── Port detection ───

async function findAvailablePort(start: number, end: number): Promise<number> {
  for (let port = start; port <= end; port++) {
    try {
      const server = Bun.serve({ port, fetch() { return new Response(""); } });
      server.stop();
      return port;
    } catch {
      // port in use, try next
    }
  }
  throw new Error(`No available port in range ${start}-${end}`);
}

// ─── Config bridge (reads ~/.simple-code/config.toml) ───

function loadMemoryConfig(): { port: number; portRangeEnd: number } {
  // Priority: env var > config file > default
  if (process.env.SIMPLE_CODE_MEMORY_PORT) {
    const port = parseInt(process.env.SIMPLE_CODE_MEMORY_PORT, 10);
    return { port, portRangeEnd: port + 8 };
  }
  try {
    const cfg = loadConfig();
    const port = cfg.memory?.port ?? PORT_RANGE_START;
    const end = cfg.memory?.port_range_end ?? (port + 8);
    return { port, portRangeEnd: end };
  } catch {
    return { port: PORT_RANGE_START, portRangeEnd: PORT_RANGE_START + 8 };
  }
}

// ─── Observe handler (forward to agentmemory via real provider) ───

async function handleObserve(payload: unknown): Promise<Response> {
  const parsed = ObservePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 });
  }

  state.observationsTotal++;
  state.lastObserveAt = parsed.data.timestamp;

  // Forward to agentmemory via HTTP provider (CLI can't observe)
  if (!state.observeProvider) {
    return new Response(JSON.stringify({
      ok: true,
      id: state.observationsTotal,
      agentmemory: { available: false, reason: "HTTP observe provider not initialized" },
    }), { status: 200 });
  }

  try {
    await state.observeProvider.observe(parsed.data.event, parsed.data);
    return new Response(JSON.stringify({
      ok: true,
      id: state.observationsTotal,
      agentmemory: { available: true, mode: state.agentmemoryStatus?.mode },
    }), { status: 200 });
  } catch (err) {
    // Provider.observe() failed — return 200 with warning (fire-and-forget semantics)
    return new Response(JSON.stringify({
      ok: true,
      id: state.observationsTotal,
      agentmemory: { available: false, error: String(err) },
    }), { status: 200 });
  }
}

// ─── Health handler ───

function handleHealth(): Response {
  const elapsed_s = (Date.now() - state.startedAt) / 1000;
  const body: HealthResponse = {
    status: "ok",
    port: state.port,
    uptime_s: Math.round(elapsed_s),
    observations_total: state.observationsTotal,
    last_observe_at: state.lastObserveAt,
    agentmemory: state.agentmemoryStatus ?? { available: false, mode: "unavailable", reason: "not initialized" },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── HTTP server ───

async function main(): Promise<void> {
  const cfg = loadMemoryConfig();
  const port = await findAvailablePort(cfg.port, cfg.portRangeEnd);
  state.port = port;

  // Initialize real agentmemory provider (auto for status, HTTP for observe)
  state.provider = await createProvider({ mode: "auto", timeoutMs: 5000 });
  state.observeProvider = await createProvider({ mode: "http", timeoutMs: 5000 });
  state.agentmemoryStatus = await state.provider.status();
  const observeStatus = await state.observeProvider.status();
  process.stdout.write(`agentmemory: status=${state.agentmemoryStatus.available ? "connected" : "unavailable"} (${state.agentmemoryStatus.mode}), observe=${observeStatus.available ? "connected" : "unavailable"} (${observeStatus.mode})\n`);

  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/health" && req.method === "GET") {
        return handleHealth();
      }

      if (url.pathname === "/memory/observe" && req.method === "POST") {
        return req.json().then(handleObserve);
      }

      return new Response("simple-coded: not found", { status: 404 });
    },
  });

  process.stdout.write(`simple-coded listening on :${port}\n`);
  process.stdout.write(`  POST /memory/observe  — receive event payload\n`);
  process.stdout.write(`  GET  /health          — daemon status\n`);
  process.stdout.write(`  PID: ${process.pid}\n`);

  // Graceful shutdown
  process.on("SIGTERM", () => { server.stop(); process.exit(0); });
  process.on("SIGINT", () => { server.stop(); process.exit(0); });
}

main().catch((err) => {
  process.stderr.write(`simple-coded: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
