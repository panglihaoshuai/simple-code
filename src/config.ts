// `simple-code config` subcommand: show / set / unset / list
// Operates on ~/.simple-code/config.toml (or SIMPLE_CODE_CONFIG env override)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { DEFAULT_CONFIG } from "../packages/config/src/config.schema.js";

const DEFAULT_PATH = `${process.env.HOME}/.simple-code/config.toml`;

const HELP = `simple-code config — read & write ~/.simple-code/config.toml

Subcommands:
  show                   print the full merged config (defaults + user)
  list                   print all set keys with their values
  get <dotted.key>       print the value at the key
  set <dotted.key> <v>   set a value (creates key if missing)
  unset <dotted.key>     remove a key (falls back to default)
  path                   print the config file path
`;

type TomlObject = Record<string, unknown>;

function configPath(): string {
  return process.env.SIMPLE_CODE_CONFIG ?? DEFAULT_PATH;
}

function loadRaw(path: string): TomlObject {
  if (!existsSync(path)) return {};
  return parseToml(readFileSync(path, "utf-8")) as TomlObject;
}

function saveRaw(path: string, raw: TomlObject): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, stringifyToml(raw));
}

function getPath(raw: TomlObject, dottedKey: string): unknown {
  const parts = dottedKey.split(".");
  let cur: unknown = raw;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as TomlObject)[p as string];
  }
  return cur;
}

function setPath(raw: TomlObject, dottedKey: string, value: string): void {
  const parts = dottedKey.split(".");
  let cur: TomlObject = raw;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i] as string;
    const next = cur[p];
    if (typeof next !== "object" || next === null) {
      cur[p] = {};
    }
    cur = cur[p] as TomlObject;
  }
  cur[parts[parts.length - 1] as string] = coerceValue(value);
}

function unsetPath(raw: TomlObject, dottedKey: string): boolean {
  const parts = dottedKey.split(".");
  let cur: TomlObject = raw;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i] as string;
    const next = cur[p];
    if (typeof next !== "object" || next === null) return false;
    cur = next as TomlObject;
  }
  const last = parts[parts.length - 1] as string;
  if (last in cur) {
    delete cur[last];
    return true;
  }
  return false;
}

function coerceValue(s: string): string | number | boolean {
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}

function flattenDefaults(d: unknown, prefix = ""): [string, unknown][] {
  if (d === null || d === undefined) return [];
  if (typeof d !== "object" || Array.isArray(d)) return [[prefix, d]];
  const out: [string, unknown][] = [];
  for (const [k, v] of Object.entries(d as TomlObject)) {
    const next = prefix ? `${prefix}.${k}` : k;
    out.push(...flattenDefaults(v, next));
  }
  return out;
}

export async function runConfig(args: string[]): Promise<void> {
  const [sub, ...rest] = args;

  if (!sub || sub === "--help" || sub === "-h") {
    process.stdout.write(HELP);
    return;
  }

  const path = configPath();

  switch (sub) {
    case "path": {
      process.stdout.write(`${path}\n`);
      return;
    }
    case "show": {
      const raw = loadRaw(path);
      const effective = Object.keys(raw).length > 0 ? raw : (DEFAULT_CONFIG as unknown as TomlObject);
      process.stdout.write(stringifyToml(effective));
      return;
    }
    case "list": {
      const raw = loadRaw(path);
      const merged: TomlObject = { ...(DEFAULT_CONFIG as unknown as TomlObject), ...raw };
      const flat = flattenDefaults(merged).sort(([a], [b]) => a.localeCompare(b));
      for (const [k, v] of flat) {
        process.stdout.write(`${k} = ${JSON.stringify(v)}\n`);
      }
      return;
    }
    case "get": {
      const key = rest[0];
      if (!key) {
        process.stderr.write("config get: missing <dotted.key>\n");
        process.exit(2);
      }
      const raw = loadRaw(path);
      const userVal = getPath(raw, key);
      if (userVal !== undefined) {
        process.stdout.write(`${JSON.stringify(userVal)}\n`);
      } else {
        const defVal = getPath(DEFAULT_CONFIG as unknown as TomlObject, key);
        if (defVal === undefined) {
          process.stderr.write(`config get: key not found: ${key}\n`);
          process.exit(1);
        }
        process.stdout.write(`${JSON.stringify(defVal)}\n`);
      }
      return;
    }
    case "set": {
      const [key, value] = rest;
      if (!key || value === undefined) {
        process.stderr.write("config set: missing <dotted.key> <value>\n");
        process.exit(2);
      }
      const raw = loadRaw(path);
      setPath(raw, key, value);
      saveRaw(path, raw);
      process.stdout.write(`set ${key} = ${JSON.stringify(coerceValue(value))}\n`);
      return;
    }
    case "unset": {
      const key = rest[0];
      if (!key) {
        process.stderr.write("config unset: missing <dotted.key>\n");
        process.exit(2);
      }
      const raw = loadRaw(path);
      const removed = unsetPath(raw, key);
      saveRaw(path, raw);
      if (removed) {
        process.stdout.write(`unset ${key} (removed from user config; default will apply)\n`);
      } else {
        process.stdout.write(`unset ${key} (was not in user config; default still applies)\n`);
      }
      return;
    }
    default:
      process.stderr.write(`Unknown subcommand: ${sub}\n${HELP}`);
      process.exit(2);
  }
}
