// packages/agentmemory/src/index.ts — AgentMemory provider factory

import type { AgentMemoryProvider, AgentMemoryStatus, AgentMemoryHealth } from "./types.js";
import { CLIAgentMemoryProvider } from "./cli-provider.js";
import { HTTPAgentMemoryProvider } from "./http-provider.js";

export type { AgentMemoryProvider, AgentMemoryStatus, AgentMemoryHealth } from "./types.js";
export { CLIAgentMemoryProvider } from "./cli-provider.js";
export { HTTPAgentMemoryProvider } from "./http-provider.js";

export type ProviderMode = "auto" | "cli" | "http";

export interface AgentMemoryConfig {
  enabled: boolean;
  mode: ProviderMode;
  command: string;
  endpoint: string;
  timeoutMs: number;
}

export const DEFAULT_AGENTMEMORY_CONFIG: AgentMemoryConfig = {
  enabled: true,
  mode: "auto",
  command: "agentmemory",
  endpoint: "http://localhost:3111",
  timeoutMs: 5000,
};

/**
 * Create an agentmemory provider based on config.
 * Auto mode: try CLI first, then HTTP, then unavailable.
 */
export async function createProvider(config: Partial<AgentMemoryConfig> = {}): Promise<AgentMemoryProvider> {
  const cfg = { ...DEFAULT_AGENTMEMORY_CONFIG, ...config };

  if (!cfg.enabled) {
    return new UnavailableProvider("agentmemory disabled in config");
  }

  if (cfg.mode === "cli") {
    return new CLIAgentMemoryProvider(cfg.command, cfg.timeoutMs);
  }

  if (cfg.mode === "http") {
    return new HTTPAgentMemoryProvider(cfg.endpoint, cfg.timeoutMs);
  }

  // Auto: try CLI first
  const cli = new CLIAgentMemoryProvider(cfg.command, cfg.timeoutMs);
  const cliStatus = await cli.status();
  if (cliStatus.available) return cli;

  // Try HTTP
  const http = new HTTPAgentMemoryProvider(cfg.endpoint, cfg.timeoutMs);
  const httpStatus = await http.status();
  if (httpStatus.available) return http;

  // Neither available
  return new UnavailableProvider(
    `agentmemory not available: CLI=${cliStatus.reason}, HTTP=${httpStatus.reason}`
  );
}

class UnavailableProvider implements AgentMemoryProvider {
  private reason: string;

  constructor(reason: string) {
    this.reason = reason;
  }

  async status(): Promise<AgentMemoryStatus> {
    return { available: false, mode: "unavailable", reason: this.reason };
  }

  async health(): Promise<AgentMemoryHealth> {
    return { status: "error", sessions: 0, observations: 0, memories: 0, graph: { nodes: 0, edges: 0 } };
  }

  async search(_query: string, _limit?: number): Promise<unknown[]> {
    throw new Error(this.reason);
  }

  async observe(_event: string, _data: unknown): Promise<void> {
    throw new Error(this.reason);
  }
}
