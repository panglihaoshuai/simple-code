// packages/codegraph/src/index.ts — CodeGraph: AST-backed TypeScript/JavaScript symbol extraction
// Provides project-level analysis and backward-compatible single-file analyze()

import { join } from "node:path";
import type { ProjectGraphResult, CodeSymbol, ImportEdge, ExportEdge } from "./types.js";
import { collectFiles, parseFile } from "./typescript-parser.js";

export type { SymbolKind, CodeSymbol, ImportEdge, ExportEdge, ProjectGraphResult, CodeGraphCapabilities } from "./types.js";
export { getCodeGraphCapabilities, CODEGRAPH_CAPABILITIES } from "./types.js";
export type { CodeGraphProvider, CodeGraphStatus, CodeGraphMode } from "./provider-types.js";
export { FullCodeGraphProvider } from "./full-provider.js";
export { LiteCodeGraphProvider } from "./lite-provider.js";
export { resolveProvider, isUpstreamAvailable, isManagedRuntimeAvailable, type ProviderConfig, type ProviderResolution } from "./provider-factory.js";
export { resolveManagedRuntime, runManagedCodegraph, type ManagedRuntimeStatus, type ManagedRuntimeSource } from "./managed-runtime.js";

// ─── Backward-compatible types (from regex era) ───

export interface Symbol {
  name: string;
  kind: "function" | "class" | "variable" | "interface" | "type" | "import";
  file: string;
  line: number;
  endLine: number;
}

export interface CodeGraphResult {
  file: string;
  symbols: Symbol[];
  lines: number;
}

// ─── Project-level AST analysis ───

/**
 * Analyze an entire project directory using TypeScript Compiler API.
 * Scans .ts/.tsx/.js/.jsx files, extracts symbols, imports, exports.
 */
export function analyzeProject(rootDir: string): ProjectGraphResult {
  const diagnostics: string[] = [];
  const files = collectFiles(rootDir);

  const allSymbols: CodeSymbol[] = [];
  const allImports: ImportEdge[] = [];
  const allExports: ExportEdge[] = [];

  for (const file of files) {
    try {
      const result = parseFile(file, rootDir, diagnostics);
      allSymbols.push(...result.symbols);
      allImports.push(...result.imports);
      allExports.push(...result.exports);
    } catch (err) {
      const relFile = file.replace(rootDir, "").replace(/^\//, "");
      diagnostics.push(`${relFile}: unexpected error — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Stable sort
  allSymbols.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.name.localeCompare(b.name));
  allImports.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
  allExports.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));

  return { root: rootDir, files, symbols: allSymbols, imports: allImports, exports: allExports, diagnostics };
}

// ─── Backward-compatible single-file analyze ───

/**
 * Extract symbols from a single source string.
 * Backward compatible with old regex-based API.
 * Uses TypeScript parser for AST extraction.
 */
export function analyze(source: string, filePath: string): CodeGraphResult {
  const diagnostics: string[] = [];
  const tmpDir = "/tmp/codegraph-compat";
  const fs = require("fs") as typeof import("node:fs");
  const path = require("path") as typeof import("node:path");

  // Write source to temp file for AST parsing
  const tmpFile = path.join(tmpDir, path.basename(filePath));
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpFile, source);
  } catch {
    // Fallback to regex if file system unavailable
    return extractSymbolsRegexFallback(source, filePath);
  }

  try {
    const result = parseFile(tmpFile, tmpDir, diagnostics);
    const symbols: Symbol[] = result.symbols
      .filter(s => s.kind !== "method") // Old API didn't have methods
      .map(s => ({
        name: s.name,
        kind: s.kind as Symbol["kind"],
        file: filePath,
        line: s.line,
        endLine: s.line,
      }));

    return { file: filePath, symbols, lines: source.split("\n").length };
  } catch {
    return extractSymbolsRegexFallback(source, filePath);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ─── Legacy regex fallback (for when TS parser unavailable) ───

function extractSymbolsRegexFallback(source: string, filePath: string): CodeGraphResult {
  const symbols: Symbol[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) symbols.push({ name: funcMatch[1] as string, kind: "function", file: filePath, line: i + 1, endLine: i + 1 });

    const arrowMatch = line.match(/^(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
    if (arrowMatch) symbols.push({ name: arrowMatch[1] as string, kind: "function", file: filePath, line: i + 1, endLine: i + 1 });

    const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
    if (classMatch) symbols.push({ name: classMatch[1] as string, kind: "class", file: filePath, line: i + 1, endLine: i + 1 });

    const ifaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
    if (ifaceMatch) symbols.push({ name: ifaceMatch[1] as string, kind: "interface", file: filePath, line: i + 1, endLine: i + 1 });

    const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
    if (typeMatch) symbols.push({ name: typeMatch[1] as string, kind: "type", file: filePath, line: i + 1, endLine: i + 1 });

    const constMatch = line.match(/^(?:export\s+)?const\s+(\w+)\s*[=:]/);
    if (constMatch && !arrowMatch) symbols.push({ name: constMatch[1] as string, kind: "variable", file: filePath, line: i + 1, endLine: i + 1 });
  }

  return { file: filePath, symbols, lines: lines.length };
}
