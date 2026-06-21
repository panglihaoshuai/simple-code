// packages/codegraph/src/typescript-parser.ts — AST-backed TypeScript/JavaScript parser
// Uses TypeScript Compiler API for reliable symbol extraction

import ts from "typescript";
import { basename, relative, join } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import type { CodeSymbol, ImportEdge, ExportEdge, SymbolKind } from "./types.js";

const SUPPORTED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"]);
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".codegraph", ".next", "build", "coverage"]);
const MAX_FILE_SIZE = 500_000; // 500KB

export function collectFiles(rootDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile() && st.size <= MAX_FILE_SIZE) {
        const ext = entry.includes(".") ? "." + entry.split(".").pop()!.toLowerCase() : "";
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          files.push(full);
        }
      }
    }
  }

  walk(rootDir);
  files.sort();
  return files;
}

export function parseFile(
  filePath: string,
  rootDir: string,
  diagnostics: string[],
): { symbols: CodeSymbol[]; imports: ImportEdge[]; exports: ExportEdge[] } {
  const relPath = relative(rootDir, filePath);
  const symbols: CodeSymbol[] = [];
  const imports: ImportEdge[] = [];
  const exports: ExportEdge[] = [];

  let sourceText: string;
  try {
    sourceText = readFileSync(filePath, "utf-8");
  } catch (err) {
    diagnostics.push(`${relPath}: unreadable — ${err instanceof Error ? err.message : String(err)}`);
    return { symbols, imports, exports };
  }

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const scriptKind =
    ext === "tsx" ? ts.ScriptKind.TSX :
    ext === "jsx" ? ts.ScriptKind.JSX :
    ext === "mts" || ext === "mjs" ? ts.ScriptKind.TS :
    ext === "ts" ? ts.ScriptKind.TS :
    ts.ScriptKind.JS;

  let sourceFile: ts.SourceFile;
  try {
    sourceFile = ts.createSourceFile(basename(filePath), sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  } catch (err) {
    diagnostics.push(`${relPath}: parse error — ${err instanceof Error ? err.message : String(err)}`);
    return { symbols, exports, imports };
  }

  const { line: sl, character: sc } = sourceFile.getLineAndCharacterOfPosition(0);
  void sl; void sc;

  function addSymbol(name: string, kind: SymbolKind, node: ts.Node, exported: boolean, parent?: string) {
    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    symbols.push({
      id: `${kind}:${name}:${relPath}:${pos.line + 1}`,
      name,
      kind,
      file: relPath,
      line: pos.line + 1,
      column: pos.character,
      exported,
      parent,
    });
  }

  function isExported(node: ts.Node): boolean {
    // Check if this node has export modifier
    if ("modifiers" in node && Array.isArray((node as { modifiers?: readonly ts.Modifier[] }).modifiers)) {
      const mods = (node as { modifiers: readonly ts.Modifier[] }).modifiers;
      if (mods.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) return true;
    }
    // Check if parent is exported variable statement
    if (node.parent && ts.isVariableStatement(node.parent)) {
      const parentMods = node.parent.modifiers;
      if (parentMods && parentMods.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) return true;
    }
    return false;
  }

  function visit(node: ts.Node) {
    // Function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      addSymbol(node.name.text, "function", node, isExported(node));
    }

    // Class declarations
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      addSymbol(className, "class", node, isExported(node));

      // Methods
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
          addSymbol(member.name.text, "method", member, false, className);
        }
      }
    }

    // Interface declarations
    if (ts.isInterfaceDeclaration(node)) {
      addSymbol(node.name.text, "interface", node, isExported(node));
    }

    // Type aliases
    if (ts.isTypeAliasDeclaration(node)) {
      addSymbol(node.name.text, "type", node, isExported(node));
    }

    // Enum declarations
    if (ts.isEnumDeclaration(node)) {
      addSymbol(node.name.text, "enum", node, isExported(node));
    }

    // Variable declarations (const/let/var)
    if (ts.isVariableStatement(node)) {
      const mods = node.modifiers;
      const exported = !!(mods && mods.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          addSymbol(decl.name.text, "variable", decl, exported);
        }
      }
    }

    // Import declarations
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const importedFrom = node.moduleSpecifier.text;
      const names: string[] = [];
      if (node.importClause) {
        if (node.importClause.name) {
          names.push(node.importClause.name.text);
        }
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const el of node.importClause.namedBindings.elements) {
              names.push(el.name.text);
            }
          }
          if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            names.push(node.importClause.namedBindings.name.text);
          }
        }
      }
      if (names.length > 0) {
        imports.push({ sourceFile: relPath, importedFrom, names });
      }
    }

    // Export declarations (re-exports)
    if (ts.isExportDeclaration(node)) {
      const names: string[] = [];
      let reExportFrom: string | undefined;
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        reExportFrom = node.moduleSpecifier.text;
      }
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          names.push(el.name.text);
        }
      }
      if (names.length > 0) {
        exports.push({ sourceFile: relPath, names, reExportFrom });
      }
    }

    // Export assignment (export default / export =)
    if (ts.isExportAssignment(node)) {
      exports.push({ sourceFile: relPath, names: ["default"] });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { symbols, imports, exports };
}
