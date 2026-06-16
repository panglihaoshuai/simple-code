// Config bridge — reads ~/.simple-code/config.toml using packages/config
import { parse as parseToml } from "smol-toml";
import { readFileSync, existsSync } from "node:fs";

const CONFIG_PATH = `${process.env.HOME}/.simple-code/config.toml`;

interface MemoryConfig {
  port: number;
}

interface SimpleCodeConfig {
  memory?: MemoryConfig;
}

export function loadConfig(): SimpleCodeConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { memory: { port: 3111 } };
  }
  try {
    const raw = parseToml(readFileSync(CONFIG_PATH, "utf-8")) as SimpleCodeConfig;
    return { memory: { port: raw.memory?.port ?? 3111 } };
  } catch {
    return { memory: { port: 3111 } };
  }
}
