// packages/agentmemory/src/types.ts — AgentMemory provider types

export type AgentMemoryStatus = {
  available: boolean;
  mode: "cli" | "http" | "unavailable";
  version?: string;
  endpoint?: string;
  reason?: string;
};

export type AgentMemoryHealth = {
  status: "ok" | "unknown" | "error";
  sessions: number;
  observations: number;
  memories: number;
  graph: { nodes: number; edges: number };
};

export interface AgentMemoryProvider {
  /** Check if agentmemory is available */
  status(): Promise<AgentMemoryStatus>;

  /** Get health info from agentmemory daemon */
  health(): Promise<AgentMemoryHealth>;

  /** Search memories */
  search(query: string, limit?: number): Promise<unknown[]>;

  /** Write an observation */
  observe(event: string, data: unknown): Promise<void>;
}
