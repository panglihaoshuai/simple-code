// packages/agentmemory/src/http-provider.ts — Real agentmemory HTTP provider
// Uses agentmemory daemon HTTP API for real integration

import type { AgentMemoryProvider, AgentMemoryStatus, AgentMemoryHealth } from "./types.js";

export class HTTPAgentMemoryProvider implements AgentMemoryProvider {
  private endpoint: string;
  private timeoutMs: number;

  constructor(endpoint = "http://localhost:3111", timeoutMs = 5000) {
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
  }

  async status(): Promise<AgentMemoryStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.endpoint}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return { available: false, mode: "http", endpoint: this.endpoint, reason: `HTTP ${res.status}` };
      }

      return { available: true, mode: "http", endpoint: this.endpoint };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return { available: false, mode: "http", endpoint: this.endpoint, reason };
    }
  }

  async health(): Promise<AgentMemoryHealth> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.endpoint}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return { status: "error", sessions: 0, observations: 0, memories: 0, graph: { nodes: 0, edges: 0 } };
      }

      const data = (await res.json()) as Record<string, unknown>;
      return {
        status: (data.status as string) === "ok" ? "ok" : "unknown",
        sessions: (data.sessions as number) ?? 0,
        observations: (data.observations as number) ?? 0,
        memories: (data.memories as number) ?? 0,
        graph: {
          nodes: ((data.graph as Record<string, number>)?.nodes) ?? 0,
          edges: ((data.graph as Record<string, number>)?.edges) ?? 0,
        },
      };
    } catch {
      return { status: "error", sessions: 0, observations: 0, memories: 0, graph: { nodes: 0, edges: 0 } };
    }
  }

  async search(query: string, limit = 10): Promise<unknown[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.endpoint}/memory/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as { results?: unknown[] };
      return data.results ?? [];
    } catch (err) {
      throw new Error(`agentmemory search failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async observe(event: string, data: unknown): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.endpoint}/memory/observe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      throw new Error(`agentmemory observe failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
