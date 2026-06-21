// packages/codegraph/src/lite-provider.ts — Lite TS/JS AST provider
// Reuses existing typescript-parser.ts; no external dependency

import { analyzeProject } from "./typescript-parser.js";
import type {
  CodeGraphProvider,
  CodeGraphStatus,
  CodeGraphCapabilities,
  CodeGraphMode,
} from "./provider-types.js";

export class LiteCodeGraphProvider implements CodeGraphProvider {
  async status(projectRoot: string): Promise<CodeGraphStatus> {
    const result = analyzeProject(projectRoot);
    return {
      mode: "lite" as CodeGraphMode,
      available: true,
      initialized: true,
      languages: ["typescript", "javascript"],
      mcpAvailable: false,
      reason: result.diagnostics.length > 0 ? `${result.diagnostics.length} diagnostics` : undefined,
    };
  }

  async initialize(_projectRoot: string, _options?: { dryRun?: boolean }): Promise<void> {
    // No-op for Lite — no persistent state
  }

  async query(projectRoot: string, searchTerm: string): Promise<unknown[]> {
    const result = analyzeProject(projectRoot);
    return result.symbols.filter((s: { name: string }) => s.name.includes(searchTerm));
  }

  async capabilities(): Promise<CodeGraphCapabilities> {
    return {
      parser: "typescript-ast",
      supportedExtensions: [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"],
      supportsSymbols: true,
      supportsImports: true,
      supportsExports: true,
      supportsCrossFile: false,
      supportsCallers: false,
      supportsImpact: false,
      supportsMCP: false,
      supportsAutoSync: false,
      referenceMode: "syntactic",
    };
  }
}