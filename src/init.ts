// `simple-code init` subcommand: detect opencode + patch opencode.json + start daemon
// This is the entry point for the very first install. M2 stub focuses on the config-write portion.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { stringify as stringifyToml } from "smol-toml";
import { DEFAULT_CONFIG } from "../packages/config/src/config.schema.js";

const HELP = `simple-code init — first-time install

Steps:
  1. Detect 'opencode' on PATH
  2. Add 'simple-code' to ~/.config/opencode/opencode.json plugin array
  3. Write ~/.simple-code/config.toml with default (China-friendly) sources
  4. Print success message (daemon start is M4 task)
`;

const OPENCODE_CONFIG = `${process.env.HOME}/.config/opencode/opencode.json`;
const SIMPLE_CODE_CONFIG = `${process.env.HOME}/.simple-code/config.toml`;

function whichOpencode(): string | null {
  const path = process.env.PATH ?? "";
  for (const dir of path.split(":")) {
    const candidate = `${dir}/opencode`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function patchOpencodeJson(insert: string): { changed: boolean; error?: string } {
  if (!existsSync(OPENCODE_CONFIG)) {
    return { changed: false, error: `opencode config not found at ${OPENCODE_CONFIG}` };
  }
  const raw = JSON.parse(readFileSync(OPENCODE_CONFIG, "utf-8")) as { plugin?: string[] };
  if (!Array.isArray(raw.plugin)) raw.plugin = [];
  if (raw.plugin.includes(insert)) return { changed: false };
  raw.plugin.push(insert);
  const dir = dirname(OPENCODE_CONFIG);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OPENCODE_CONFIG, JSON.stringify(raw, null, 2));
  return { changed: true };
}

function writeDefaultConfig(): void {
  const dir = dirname(SIMPLE_CODE_CONFIG);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(SIMPLE_CODE_CONFIG)) return; // do not overwrite existing config
  writeFileSync(SIMPLE_CODE_CONFIG, stringifyToml(DEFAULT_CONFIG));
}

export async function runInit(args: string[]): Promise<void> {
  if (args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(HELP);
    return;
  }

  const opencodeBin = whichOpencode();
  if (!opencodeBin) {
    process.stderr.write(`✗ opencode not found on PATH\n  install: brew install opencode\n`);
    process.exit(1);
  }
  process.stdout.write(`✓ opencode found: ${opencodeBin}\n`);

  const patch = patchOpencodeJson("simple-code");
  if (patch.error) {
    process.stderr.write(`✗ ${patch.error}\n`);
    process.exit(1);
  }
  if (patch.changed) {
    process.stdout.write(`✓ added 'simple-code' to ${OPENCODE_CONFIG}\n`);
  } else {
    process.stdout.write(`✓ 'simple-code' already in ${OPENCODE_CONFIG}\n`);
  }

  writeDefaultConfig();
  process.stdout.write(`✓ wrote default config to ${SIMPLE_CODE_CONFIG}\n`);
  process.stdout.write(`\nDone. Start opencode to use simple-code.\n`);
  process.stdout.write(`\n(M4 daemon auto-start is not yet implemented — M4 task pending.)\n`);
}
