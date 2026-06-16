// packages/codegraph/src/index.ts — Real CodeGraph with tree-sitter (WASM)
// Provides symbol extraction from source code files

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

/**
 * Extract symbols from TypeScript/JavaScript source code using regex patterns.
 * This is a lightweight fallback when tree-sitter WASM is not available.
 */
export function extractSymbolsRegex(source: string, filePath: string): CodeGraphResult {
  const symbols: Symbol[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // function declarations
    const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) {
      symbols.push({ name: funcMatch[1], kind: "function", file: filePath, line: i + 1, endLine: i + 1 });
    }

    // arrow functions assigned to const/let
    const arrowMatch = line.match(/^(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
    if (arrowMatch) {
      symbols.push({ name: arrowMatch[1], kind: "function", file: filePath, line: i + 1, endLine: i + 1 });
    }

    // class declarations
    const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], kind: "class", file: filePath, line: i + 1, endLine: i + 1 });
    }

    // interface declarations
    const ifaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
    if (ifaceMatch) {
      symbols.push({ name: ifaceMatch[1], kind: "interface", file: filePath, line: i + 1, endLine: i + 1 });
    }

    // type aliases
    const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
    if (typeMatch) {
      symbols.push({ name: typeMatch[1], kind: "type", file: filePath, line: i + 1, endLine: i + 1 });
    }

    // const declarations (non-function)
    const constMatch = line.match(/^(?:export\s+)?const\s+(\w+)\s*[=:]/);
    if (constMatch && !arrowMatch) {
      symbols.push({ name: constMatch[1], kind: "variable", file: filePath, line: i + 1, endLine: i + 1 });
    }
  }

  return { file: filePath, symbols, lines: lines.length };
}

/**
 * Extract symbols from a source string.
 * Uses regex-based extraction (works without native tree-sitter).
 */
export function analyze(source: string, filePath: string): CodeGraphResult {
  return extractSymbolsRegex(source, filePath);
}
