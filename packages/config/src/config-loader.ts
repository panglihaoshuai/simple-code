import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ConfigSchema, DEFAULT_CONFIG, type Config } from "./config.schema.js";

export { DEFAULT_CONFIG };
export type { Config };

// Deep merge: defaults <- user
function deepMerge<T extends Record<string, unknown>>(defaults: T, user: Partial<T> | undefined): T {
  if (!user) return defaults;
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(user)) {
    const uv = user[key];
    const dv = (defaults as Record<string, unknown>)[key];
    if (
      uv !== undefined &&
      typeof uv === "object" &&
      uv !== null &&
      !Array.isArray(uv) &&
      typeof dv === "object" &&
      dv !== null &&
      !Array.isArray(dv)
    ) {
      out[key] = deepMerge(dv as Record<string, unknown>, uv as Record<string, unknown>);
    } else if (uv !== undefined) {
      out[key] = uv;
    }
  }
  return out as T;
}

export class ConfigLoader {
  private raw: Record<string, unknown> | undefined;
  public readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  static fromFile(path: string): ConfigLoader {
    const loader = new ConfigLoader(path);
    loader.load();
    return loader;
  }

  static fromString(raw: string): ConfigLoader {
    const loader = new ConfigLoader("<string>");
    loader.raw = parseToml(raw);
    return loader;
  }

  load(): this {
    if (existsSync(this.path)) {
      const text = readFileSync(this.path, "utf-8");
      this.raw = parseToml(text) as Record<string, unknown>;
    }
    return this;
  }

  validate(): { ok: true; data: Config } | { ok: false; error: string } {
    const merged = deepMerge(DEFAULT_CONFIG as unknown as Record<string, unknown>, this.raw);
    const result = ConfigSchema.safeParse(merged);
    if (result.success) {
      return { ok: true, data: result.data as unknown as Config };
    }
    return {
      ok: false,
      error: result.error.issues
        .map((e: { path: PropertyKey[]; message: string }) => `${e.path.map(String).join(".")}: ${e.message}`)
        .join("; "),
    };
  }

  get data(): Config {
    const validation = this.validate();
    if (!validation.ok) {
      throw new Error(`Invalid config: ${validation.error}`);
    }
    return validation.data;
  }

  save(data: Config): void {
    const dir = dirname(this.path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const validation = ConfigSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(`Invalid config: ${validation.error.message}`);
    }
    writeFileSync(this.path, stringifyToml(validation.data));
  }
}
