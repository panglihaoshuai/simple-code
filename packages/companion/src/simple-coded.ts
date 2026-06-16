// simple-coded daemon — Bun HTTP server wrapping agentmemory observe API
// Listens on :3111 (default, port-avoidance to 3112-3119 if occupied)
// POST /memory/observe — receive event payload, forward to agentmemory
// GET  /health         — daemon status

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ObservePayloadSchema, type HealthResponse } from "./types.js";
import { loadConfig } from "./config-bridge.js";

const PORT_RANGE_START = parseInt(process.env.SIMPLE_CODE_MEMORY_PORT || "3111", 10);
const PORT_RANGE_END = parseInt(process.env.SIMPLE_CODE_MEMORY_PORT_RANGE_END || "3119", 10);

// ─── State ───

const state = {
  port: PORT_RANGE_START,
  startedAt: Date.now(),
  observationsTotal: 0,
  lastObserveAt: null as string | null,
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

// ─── Observe handler (forward to agentmemory HTTP API) ───

async function handleObserve(payload: unknown): Promise<Response> {
  const parsed = ObservePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 });
  }

  state.observationsTotal++;
  state.lastObserveAt = parsed.data.timestamp;

  // Forward to agentmemory daemon (same host, different port or same process)
  // For now: stub that logs observation (real integration: POST to agentmemory :3111/observe)
  try {
    // TODO: forward to real agentmemory HTTP API when available
    // const res = await fetch(`http://localhost:${agentmemoryPort}/observe`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(parsed.data),
    // });
    return new Response(JSON.stringify({ ok: true, id: state.observationsTotal }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 502 });
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
