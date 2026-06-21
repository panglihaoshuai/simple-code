// packages/codegraph/src/full-provider.ts — Managed CodeGraph provider
// Uses managed runtime (~/.codegraph/) instead of global PATH

import type {
  CodeGraphProvider,
  CodeGraphStatus,
  CodeGraphCapabilities,
  CodeGraphMode,
} from "./provider-types.js";
import { resolveManagedRuntime, runManagedCodegraph, type ManagedRuntimeStatus } from "./managed-runtime.js";
import { existsSync } from "node:fs";
import { join } from "node:path";

export class FullCodeGraphProvider implements CodeGraphProvider {
  private runtimeStatus?: ManagedRuntimeStatus;

  private resolveRuntime(homeOverride?: string): ManagedRuntimeStatus {
    if (!this.runtimeStatus) {
      this.runtimeStatus = resolveManagedRuntime({ homeOverride, allowGlobalCompat: true });
    }
    return this.runtimeStatus;
  }

  async status(projectRoot: string): Promise<CodeGraphStatus> {
    const rt = this.resolveRuntime();
    if (!rt.available) {
      return {
        mode: "missing" as CodeGraphMode,
        available: false,
        initialized: false,
        languages: [],
        mcpAvailable: false,
        reason: rt.reason,
      };
    }

    const indexPath = join(projectRoot, ".codegraph", "codegraph.db");
    const initialized = existsSync(indexPath);

    return {
      mode: rt.source === "managed-private" ? ("full" as CodeGraphMode) : ("full" as CodeGraphMode),
      available: true,
      version: rt.version,
      initialized,
      indexPath: initialized ? indexPath : undefined,
      languages: ["20+ (tree-sitter)"],
      mcpAvailable: true,
      reason: rt.source === "global-compat" ? "using global PATH codegraph" : undefined,
    };
  }

  async initialize(projectRoot: string, options?: { dryRun?: boolean }): Promise<void> {
    if (options?.dryRun) return;
    const r = runManagedCodegraph(["init", projectRoot], projectRoot);
    if (r.exitCode !== 0) {
      throw new Error(`codegraph init failed: ${r.stderr || r.stdout}`);
    }
  }

  async query(projectRoot: string, searchTerm: string): Promise<unknown[]> {
    const r = runManagedCodegraph(["query", searchTerm, "--path", projectRoot], projectRoot);
    if (r.exitCode !== 0) return [];
    return [{ raw: r.stdout }];
  }

  async capabilities(): Promise<CodeGraphCapabilities> {
    return {
      parser: "tree-sitter-multi",
      supportedExtensions: [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".cs", ".rb", ".php", ".swift", ".kt", ".scala", ".dart", ".lua", ".r", ".vue", ".svelte", ".astro"],
      supportsSymbols: true,
      supportsImports: true,
      supportsExports: true,
      supportsCrossFile: true,
      supportsCallers: true,
      supportsImpact: true,
      supportsMCP: true,
      supportsAutoSync: true,
      referenceMode: "semantic",
    };
  }
}
