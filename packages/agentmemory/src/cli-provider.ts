// packages/agentmemory/src/cli-provider.ts — Real agentmemory CLI provider
// Uses `agentmemory status` and `agentmemory doctor` for real integration

import { spawnSync } from "node:child_process";
import type { AgentMemoryProvider, AgentMemoryStatus, AgentMemoryHealth } from "./types.js";

export class CLIAgentMemoryProvider implements AgentMemoryProvider {
  private command: string;
  private timeoutMs: number;

  constructor(command = "agentmemory", timeoutMs = 5000) {
    this.command = command;
    this.timeoutMs = timeoutMs;
  }

  async status(): Promise<AgentMemoryStatus> {
    // Check if agentmemory CLI exists
    const which = spawnSync("which", [this.command], { encoding: "utf-8", timeout: this.timeoutMs });
    if (which.status !== 0) {
      return { available: false, mode: "cli", reason: `${this.command} not found on PATH` };
    }

    // Get version from --help or --version
    const help = spawnSync(this.command, ["--help"], { encoding: "utf-8", timeout: this.timeoutMs });
    const version = this.extractVersion(help.stdout ?? "");

    // Check if daemon is reachable via status command
    const statusCmd = spawnSync(this.command, ["status"], { encoding: "utf-8", timeout: this.timeoutMs });
    const statusOutput = statusCmd.stdout ?? "";
    const isReachable = statusOutput.includes("Connected") || statusOutput.includes("Health:");

    if (!isReachable) {
      return { available: false, mode: "cli", version, reason: "daemon not reachable" };
    }

    return { available: true, mode: "cli", version };
  }

  async health(): Promise<AgentMemoryHealth> {
    const statusCmd = spawnSync(this.command, ["status"], { encoding: "utf-8", timeout: this.timeoutMs });
    const output = statusCmd.stdout ?? "";

    return {
      status: output.includes("Health: ok") ? "ok" : "unknown",
      sessions: this.extractNumber(output, "Sessions:") ?? 0,
      observations: this.extractNumber(output, "Observations:") ?? 0,
      memories: this.extractNumber(output, "Memories:") ?? 0,
      graph: {
        nodes: this.extractGraphNodeCount(output) ?? 0,
        edges: this.extractGraphEdgeCount(output) ?? 0,
      },
    };
  }

  async search(_query: string, _limit?: number): Promise<unknown[]> {
    // TODO: implement real search via agentmemory CLI
    throw new Error("agentmemory search not yet implemented — CLI does not expose search command");
  }

  async observe(_event: string, _data: unknown): Promise<void> {
    // TODO: implement real observe via agentmemory CLI or HTTP
    throw new Error("agentmemory observe not yet implemented — use HTTP daemon directly");
  }

  private extractVersion(helpOutput: string): string | undefined {
    // agentmemory — persistent memory for AI coding agents
    const match = helpOutput.match(/agentmemory.*?v?(\d+\.\d+\.\d+)/i);
    return match?.[1];
  }

  private extractNumber(output: string, label: string): number | undefined {
    const regex = new RegExp(`${label}\\s*(\\d+)`);
    const match = output.match(regex);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractGraphNodeCount(output: string): number | undefined {
    const match = output.match(/Graph:\s*(\d+)\s*nodes/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractGraphEdgeCount(output: string): number | undefined {
    const match = output.match(/Graph:\s*\d+\s*nodes,\s*(\d+)\s*edges/);
    return match ? parseInt(match[1], 10) : undefined;
  }
}
