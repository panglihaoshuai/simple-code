import { describe, test, expect } from "bun:test";
import { ConfigSchema } from "../src/config.schema.js";
import { ConfigLoader, DEFAULT_CONFIG } from "../src/config-loader.js";
import { MirrorResolver } from "../src/mirror-resolver.js";

describe("config schema", () => {
  test("accepts empty object via ConfigLoader (Zod 4 nested default workaround)", () => {
    const loader = ConfigLoader.fromString("");
    const data = loader.data;
    expect(data.memory.port).toBe(3111);
    expect(data.update.auto_update).toBe(false);
    expect(data.telemetry.enabled).toBe(false);
  });

  test("rejects invalid port", () => {
    const loader = ConfigLoader.fromString(`[memory]
port = 99999`);
    const v = loader.validate();
    expect(v.ok).toBe(false);
  });

  test("rejects non-URL mirror", () => {
    const loader = ConfigLoader.fromString(`[net.llm]
mirror = "not-a-url"`);
    const v = loader.validate();
    expect(v.ok).toBe(false);
  });
});

describe("ConfigLoader", () => {
  test("loads from string", () => {
    const loader = ConfigLoader.fromString(`memory = { port = 3217 }`);
    const data = loader.data;
    expect(data.memory.port).toBe(3217);
  });

  test("mergeDefaults fills missing fields", () => {
    const loader = ConfigLoader.fromString(`memory = { port = 4096 }`);
    const data = loader.data;
    expect(data.memory.enabled).toBe(true);
    expect(data.update.auto_update).toBe(false);
  });

  test("validates against schema", () => {
    const loader = ConfigLoader.fromString(`memory = { port = "not-a-number" }`);
    const v = loader.validate();
    expect(v.ok).toBe(false);
  });

  test("DEFAULT_CONFIG is a complete Config", () => {
    expect(DEFAULT_CONFIG.memory.port).toBe(3111);
    expect(DEFAULT_CONFIG.net.lsp.mirror).toBe("https://gh-proxy.com/");
  });
});

describe("MirrorResolver", () => {
  // Use DEFAULT_CONFIG (fully populated) instead of ConfigSchema.parse({}) (Zod 4 nested default bug)
  const baseConfig = DEFAULT_CONFIG;

  test("global component mirror wins", () => {
    const resolver = new MirrorResolver(baseConfig);
    expect(resolver.resolve("lsp", "mirror")).toBe("https://gh-proxy.com/");
  });

  test("field-level override beats component mirror", () => {
    const custom = ConfigSchema.parse({
      net: { release: { github_release: "https://my-mirror.example.com" } },
    });
    const resolver = new MirrorResolver(custom);
    expect(resolver.resolve("release", "github_release")).toBe("https://my-mirror.example.com");
  });

  test("empty string = origin (no mirror)", () => {
    const custom = ConfigSchema.parse({ net: { llm: { mirror: "" } } });
    const resolver = new MirrorResolver(custom);
    expect(resolver.resolve("llm", "mirror")).toBe("");
  });

  test("cache returns same value on second call", () => {
    const resolver = new MirrorResolver(baseConfig);
    const a = resolver.resolve("lsp", "mirror");
    const b = resolver.resolve("lsp", "mirror");
    expect(a).toBe(b);
  });

  test("resolveAll returns 9 keys", () => {
    const resolver = new MirrorResolver(baseConfig);
    const all = resolver.resolveAll();
    expect(Object.keys(all).length).toBeGreaterThanOrEqual(9);
  });
});
