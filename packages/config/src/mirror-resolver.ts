import type { Config, NetConfig } from "./config.schema.js";

// MirrorResolver: 学 cargo .cargo/config.toml 范式
// 全局 [net].mirror base → 组件 [net.<comp>].<field> override，组件优先
// 字段空字符串 = 走原站

export class MirrorResolver {
  private cache: Map<string, string> = new Map();

  constructor(private config: Config) {}

  resolve(component: keyof NetConfig, field: string = "mirror"): string {
    const cacheKey = `${component}.${field}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const result = this.compute(component, field);
    this.cache.set(cacheKey, result);
    return result;
  }

  private compute(component: keyof NetConfig, field: string): string {
    // 1. 优先看组件的特定字段 (e.g. net.release.github_release)
    const net = this.config.net ?? {} as Partial<NetConfig>;
    const compSection = net[component] as Record<string, unknown> | undefined;
    if (compSection) {
      const componentField = compSection[field];
      if (typeof componentField === "string" && componentField !== "") {
        return componentField;
      }
      // 2. 组件的 mirror
      const componentMirror = compSection.mirror;
      if (typeof componentMirror === "string" && componentMirror !== "") {
        return componentMirror;
      }
    }

    // 3. 全局 net.mirror fallback (cargo .cargo/config.toml [net] base)
    const globalMirror = net.mirror;
    if (typeof globalMirror === "string" && globalMirror !== "") {
      return globalMirror;
    }

    // 4. 走原站
    return "";
  }

  resolveAll(): Record<string, string> {
    const components: Array<keyof NetConfig> = ["release", "llm", "lsp", "browser", "mcp", "upstream"];
    const fields: Record<keyof NetConfig, string[]> = {
      mirror: [],
      release: ["github_release", "homebrew_bottle", "npm_package"],
      llm: ["mirror"],
      lsp: ["mirror"],
      browser: ["mirror"],
      mcp: ["mirror"],
      upstream: ["git_clone", "github_release"],
    };
    const out: Record<string, string> = {};
    for (const comp of components) {
      for (const field of fields[comp]) {
        out[`${comp}.${field}`] = this.resolve(comp, field);
      }
    }
    return out;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
