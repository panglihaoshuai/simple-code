#!/usr/bin/env node
// simple-code CLI entry point
// Routes subcommands: `simple-code config ...`, `simple-code init`, `simple-code doctor`, etc.
// Plugin loading is handled by opencode reading src/index.ts (built to dist/index.js)

import { runConfig } from "./config.js";
import { runInit } from "./init.js";
import { runDoctor } from "./doctor.js";
import { runUninstall } from "./uninstall.js";

const HELP = `simple-code — opencode plugin CLI

Usage:
  simple-code config <subcommand>    show | set | unset | list
  simple-code init                    install plugin + write config + start daemon
  simple-code doctor [--json]         validate all components and report status
  simple-code status [--json]         alias for doctor
  simple-code codegraph <path> [--json]  analyze project with AST-backed CodeGraph
  simple-code codegraph init [path]   initialize CodeGraph index for project
  simple-code codegraph status        show CodeGraph runtime + index status
  simple-code uninstall               stop daemon + remove plugin entry
  simple-code --version               print version
  simple-code --help                  this help
`;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(HELP);
    return;
  }

  if (argv[0] === "--version" || argv[0] === "-v") {
    const pkg = await import("../package.json", { with: { type: "json" } });
    process.stdout.write(`${(pkg as { default: { version: string } }).default.version}\n`);
    return;
  }

  const [command, ...rest] = argv;
  const jsonMode = rest.includes("--json");
  const args = rest.filter(a => a !== "--json");

  switch (command) {
    case "config":
      await runConfig(rest);
      break;
    case "init":
      await runInit(rest);
      break;
    case "doctor":
    case "status":
      await runDoctor({ json: jsonMode });
      break;
    case "codegraph":
    case "analyze":
      await runCodegraphCommand(args, jsonMode);
      break;
    case "uninstall":
      await runUninstall(rest);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n${HELP}`);
      process.exit(2);
  }
}

async function runCodegraphCommand(args: string[], json: boolean): Promise<void> {
  const subcommand = args[0] ?? "";

  // simple-code codegraph init [path]
  if (subcommand === "init") {
    const projectPath = args[1] ?? ".";
    const { runManagedCodegraph, resolveManagedRuntime } = await import("../packages/codegraph/src/managed-runtime.js");
    const { resolve } = await import("node:path");
    const rootDir = resolve(projectPath);

    const rt = resolveManagedRuntime();
    if (!rt.available) {
      process.stderr.write("CodeGraph runtime not found. Run: simple-code codegraph status\n");
      process.exit(1);
    }

    process.stdout.write(`Initializing CodeGraph index for ${rootDir}...\n`);
    process.stdout.write(`Runtime: ${rt.executable} (v${rt.version})\n`);
    const r = runManagedCodegraph(["init", rootDir], rootDir, { timeoutMs: 120000 });
    if (r.exitCode !== 0) {
      process.stderr.write(`codegraph init failed: ${r.stderr || r.stdout}\n`);
      process.exit(r.exitCode);
    }
    process.stdout.write(r.stdout);
    return;
  }

  // simple-code codegraph status
  if (subcommand === "status") {
    const { resolveManagedRuntime } = await import("../packages/codegraph/src/managed-runtime.js");
    const { resolveProvider } = await import("../packages/codegraph/src/provider-factory.js");
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");

    const rt = resolveManagedRuntime();
    const { provider, mode, source } = resolveProvider();
    const status = await provider.status(process.cwd());
    const dbPath = join(process.cwd(), ".codegraph", "codegraph.db");
    const initialized = existsSync(dbPath);

    if (json) {
      process.stdout.write(JSON.stringify({ runtime: rt, provider: { mode, source }, status, initialized }, null, 2) + "\n");
      return;
    }

    process.stdout.write("CodeGraph Status\n\n");
    process.stdout.write(`Runtime source: ${rt.source}\n`);
    process.stdout.write(`Runtime version: ${rt.version ?? "N/A"}\n`);
    process.stdout.write(`Runtime executable: ${rt.executable ?? "N/A"}\n`);
    process.stdout.write(`Runtime verified: ${rt.verified}\n`);
    process.stdout.write(`Provider mode: ${mode}\n`);
    process.stdout.write(`Provider source: ${source}\n`);
    process.stdout.write(`Project index: ${initialized ? "healthy" : "not initialized"}\n`);
    if (initialized) process.stdout.write(`Index path: ${dbPath}\n`);
    process.stdout.write(`Languages: ${status.languages.join(", ")}\n`);
    if (!rt.available) process.stdout.write(`\nReason: ${rt.reason}\n`);
    return;
  }

  // simple-code codegraph <path> [--json] — analyze project with AST
  const projectPath = subcommand || ".";
  const { analyzeProject } = await import("../packages/codegraph/src/typescript-parser.js");
  const { resolve } = await import("node:path");

  const rootDir = resolve(projectPath);
  const result = analyzeProject(rootDir);

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  // Human-readable output
  process.stdout.write(`CodeGraph: ${rootDir}\n\n`);
  process.stdout.write(`Files: ${result.files.length}\n`);
  process.stdout.write(`Symbols: ${result.symbols.length}\n`);
  process.stdout.write(`Imports: ${result.imports.length}\n`);
  process.stdout.write(`Exports: ${result.exports.length}\n`);
  if (result.diagnostics.length > 0) {
    process.stdout.write(`Diagnostics: ${result.diagnostics.length}\n`);
    for (const d of result.diagnostics) {
      process.stdout.write(`  ⚠️ ${d}\n`);
    }
  }

  process.stdout.write(`\nSymbols:\n`);
  for (const s of result.symbols) {
    const exported = s.exported ? " [exported]" : "";
    const parent = s.parent ? ` (${s.parent})` : "";
    process.stdout.write(`  ${s.kind} ${s.name}${parent} @ ${s.file}:${s.line}${exported}\n`);
  }

  if (result.imports.length > 0) {
    process.stdout.write(`\nImports:\n`);
    for (const i of result.imports) {
      process.stdout.write(`  ${i.sourceFile} ← ${i.importedFrom} (${i.names.join(", ")})\n`);
    }
  }

  if (result.exports.length > 0) {
    process.stdout.write(`\nExports:\n`);
    for (const e of result.exports) {
      const re = e.reExportFrom ? ` from ${e.reExportFrom}` : "";
      process.stdout.write(`  ${e.sourceFile}: ${e.names.join(", ")}${re}\n`);
    }
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`simple-code: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
