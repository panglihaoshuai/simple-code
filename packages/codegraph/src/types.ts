// packages/codegraph/src/types.ts — CodeGraph type definitions

export type SymbolKind =
  | "function"
  | "class"
  | "method"
  | "interface"
  | "type"
  | "variable"
  | "enum"
  | "import"
  | "export";

export type CodeSymbol = {
  id: string;
  name: string;
  kind: SymbolKind;
  file: string;
  line: number;
  column: number;
  exported: boolean;
  parent?: string;
};

export type ImportEdge = {
  sourceFile: string;
  importedFrom: string;
  names: string[];
};

export type ExportEdge = {
  sourceFile: string;
  names: string[];
  reExportFrom?: string;
};

export type ProjectGraphResult = {
  root: string;
  files: string[];
  symbols: CodeSymbol[];
  imports: ImportEdge[];
  exports: ExportEdge[];
  diagnostics: string[];
};

// ─── Capability metadata for doctor gate ───

export type CodeGraphCapabilities = {
  parser: "typescript-ast" | "regex" | "unavailable";
  supportedExtensions: string[];
  supportsSymbols: boolean;
  supportsImports: boolean;
  supportsExports: boolean;
  referenceMode: "syntactic" | "semantic" | "none";
};

export const CODEGRAPH_CAPABILITIES: CodeGraphCapabilities = {
  parser: "typescript-ast",
  supportedExtensions: [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"],
  supportsSymbols: true,
  supportsImports: true,
  supportsExports: true,
  referenceMode: "syntactic",
};

export function getCodeGraphCapabilities(): CodeGraphCapabilities {
  return { ...CODEGRAPH_CAPABILITIES };
}
