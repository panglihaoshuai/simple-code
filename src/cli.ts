#!/usr/bin/env node
// simple-code CLI entry point
// Routes subcommands: `simple-code config ...`, `simple-code init`, `simple-code update`, `simple-code uninstall`
// Plugin loading is handled by opencode reading src/index.ts (built to dist/index.js)

import { runConfig } from "./config.js";
import { runInit } from "./init.js";

const HELP = `simple-code — opencode plugin CLI

Usage:
  simple-code config <subcommand>    show | set | unset | list
  simple-code init                    install plugin + write config + start daemon
  simple-code update                  check 4 upstream + upgrade
  simple-code uninstall               stop daemon + remove plugin entry
  simple-code doctor                  validate config + manifest + opencode.json
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
  switch (command) {
    case "config":
      await runConfig(rest);
      break;
    case "init":
      await runInit(rest);
      break;
    case "doctor":
      process.stdout.write("simple-code doctor: stub (M3+)\n");
      break;
    case "update":
    case "uninstall":
      process.stdout.write(`simple-code ${command}: stub (M3+)\n`);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n${HELP}`);
      process.exit(2);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`simple-code: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
