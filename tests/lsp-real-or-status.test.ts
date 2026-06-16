// tests/lsp-real-or-status.test.ts — Real LSP status detection tests
import { describe, test, expect } from "bun:test";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");

describe("LSP real status detection", () => {
  test("checkAllLsps returns 6 LSP servers", async () => {
    const { checkAllLsps } = await import(join(REPO, "packages", "lsp", "src", "status.ts"));
    const lsps = checkAllLsps();
    expect(lsps.length).toBe(6);
  });

  test("each LSP has name, language, installed fields", async () => {
    const { checkAllLsps } = await import(join(REPO, "packages", "lsp", "src", "status.ts"));
    const lsps = checkAllLsps();
    for (const lsp of lsps) {
      expect(lsp.name).toBeDefined();
      expect(lsp.language).toBeDefined();
      expect(typeof lsp.installed).toBe("boolean");
    }
  });

  test("checkLspStatus for known LSP returns valid result", async () => {
    const { checkLspStatus } = await import(join(REPO, "packages", "lsp", "src", "status.ts"));
    const result = checkLspStatus("rust-analyzer");
    expect(result.name).toBe("rust-analyzer");
    expect(result.language).toBe("rust");
    expect(typeof result.installed).toBe("boolean");
  });

  test("checkLspStatus for unknown LSP returns action hint", async () => {
    const { checkLspStatus } = await import(join(REPO, "packages", "lsp", "src", "status.ts"));
    const result = checkLspStatus("nonexistent-lsp-xyz");
    expect(result.installed).toBe(false);
    expect(result.action).toBeDefined();
  });

  test("installed LSPs have version and path", async () => {
    const { checkAllLsps } = await import(join(REPO, "packages", "lsp", "src", "status.ts"));
    const lsps = checkAllLsps();
    const installed = lsps.filter((l: { installed: boolean }) => l.installed);
    for (const lsp of installed) {
      expect(lsp.version).toBeDefined();
      expect(lsp.path).toBeDefined();
    }
  });

  test("uninstalled LSPs have install action hint", async () => {
    const { checkAllLsps } = await import(join(REPO, "packages", "lsp", "src", "status.ts"));
    const lsps = checkAllLsps();
    const missing = lsps.filter((l: { installed: boolean }) => !l.installed);
    for (const lsp of missing) {
      expect(lsp.action).toBeDefined();
      expect(lsp.action!.length).toBeGreaterThan(0);
    }
  });
});
