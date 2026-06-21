// tests/codegraph-provider.test.ts — Provider factory + Full/Lite/Missing selection
import { describe, test, expect } from "bun:test";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");

describe("CodeGraph provider factory", () => {
  test("resolveProvider returns full when codegraph CLI installed", async () => {
    const { resolveProvider, isUpstreamAvailable } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const upstream = isUpstreamAvailable();
    expect(upstream).toBe(true);
    const { mode } = resolveProvider();
    expect(mode).toBe("full");
  });

  test("resolveProvider returns lite when preferLite", async () => {
    const { resolveProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const { mode, reason } = resolveProvider({ preferLite: true });
    expect(mode).toBe("lite");
    expect(reason).toContain("preferLite");
  });

  test("Full provider status on real project", async () => {
    const { FullCodeGraphProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const provider = new FullCodeGraphProvider("codegraph");
    const status = await provider.status(REPO);
    expect(status.available).toBe(true);
    expect(status.mode).toBe("full");
    expect(status.languages.length).toBeGreaterThan(0);
  });

  test("Lite provider status works on TS project", async () => {
    const { LiteCodeGraphProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const provider = new LiteCodeGraphProvider();
    const status = await provider.status(REPO);
    expect(status.available).toBe(true);
    expect(status.mode).toBe("lite");
    expect(status.languages).toContain("typescript");
    expect(status.mcpAvailable).toBe(false);
  });

  test("Full provider capabilities include multi-language + callers", async () => {
    const { FullCodeGraphProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const caps = await new FullCodeGraphProvider("codegraph").capabilities();
    expect(caps.parser).toBe("tree-sitter-multi");
    expect(caps.supportsCallers).toBe(true);
    expect(caps.supportsImpact).toBe(true);
    expect(caps.supportsCrossFile).toBe(true);
    expect(caps.referenceMode).toBe("semantic");
  });

  test("Lite provider capabilities are TS/JS only and syntactic", async () => {
    const { LiteCodeGraphProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const caps = await new LiteCodeGraphProvider().capabilities();
    expect(caps.parser).toBe("typescript-ast");
    expect(caps.supportsCallers).toBe(false);
    expect(caps.supportsImpact).toBe(false);
    expect(caps.referenceMode).toBe("syntactic");
  });

  test("Full provider query returns upstream CLI output", async () => {
    const { FullCodeGraphProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const provider = new FullCodeGraphProvider("codegraph");
    const results = await provider.query(REPO, "analyzeProject");
    expect(Array.isArray(results)).toBe(true);
  });

  test("Lite provider query uses TypeScript AST", async () => {
    const { LiteCodeGraphProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const provider = new LiteCodeGraphProvider();
    const results = await provider.query(REPO, "analyzeProject");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test("Missing upstream → falls back to Lite (with empty home)", async () => {
    const { resolveProvider } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    // Use a non-existent home AND disable global-compat to force Lite
    const { mode, source } = resolveProvider({ homeOverride: "/tmp/nonexistent-home-xyz", allowGlobalCompat: false });
    expect(mode).toBe("lite");
    expect(source).toBe("lite-ts-ast");
  });
});