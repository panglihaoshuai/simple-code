// packages/codegraph/src/provider-types.ts — Provider types for Full/Lite/Missing

export type CodeGraphMode = "full" | "lite" | "missing";

export type CodeGraphCapabilities = {
  parser: "typescript-ast" | "tree-sitter-multi" | "regex" | "unavailable";
  supportedExtensions: string[];
  supportsSymbols: boolean;
  supportsImports: boolean;
  supportsExports: boolean;
  supportsCrossFile: boolean;
  supportsCallers: boolean;
  supportsImpact: boolean;
  supportsMCP: boolean;
  supportsAutoSync: boolean;
  referenceMode: "syntactic" | "semantic" | "none";
};

export interface CodeGraphStatus {
  mode: CodeGraphMode;
  available: boolean;
  version?: string;
  initialized: boolean;
  indexPath?: string;
  languages: string[];
  mcpAvailable: boolean;
  reason?: string;
}

export interface CodeGraphProvider {
  status(projectRoot: string): Promise<CodeGraphStatus>;
  initialize(projectRoot: string, options?: { dryRun?: boolean }): Promise<void>;
  query(projectRoot: string, searchTerm: string): Promise<unknown[]>;
  capabilities(): Promise<CodeGraphCapabilities>;
}