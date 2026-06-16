// T6.7 + T6.14: LSP abstraction layer + CLI test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T6.7: LSP abstraction layer", () => {
  test("packages/lsp directory exists", () => {
    const lspDir = join(REPO, "packages", "lsp");
    expect(existsSync(lspDir)).toBe(true);
  });

  test("packages/lsp has index.ts", () => {
    const indexPath = join(REPO, "packages", "lsp", "src", "index.ts");
    expect(existsSync(indexPath)).toBe(true);
  });

  test("LSP index exports installLsp function", async () => {
    const { installLsp } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    expect(typeof installLsp).toBe("function");
  });

  test("LSP index exports listLsps function", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    expect(typeof listLsps).toBe("function");
  });

  test("LSP index exports removeLsp function", async () => {
    const { removeLsp } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    expect(typeof removeLsp).toBe("function");
  });

  test("listLsps returns array of LSP servers", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(Array.isArray(lsps)).toBe(true);
    expect(lsps.length).toBeGreaterThanOrEqual(5);
  });

  test("supported LSPs include rust-analyzer", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(lsps.some((l: { name: string }) => l.name === "rust-analyzer")).toBe(true);
  });

  test("supported LSPs include pyright", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(lsps.some((l: { name: string }) => l.name === "pyright")).toBe(true);
  });

  test("supported LSPs include typescript-language-server", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(lsps.some((l: { name: string }) => l.name === "typescript-language-server")).toBe(true);
  });

  test("supported LSPs include jdtls", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(lsps.some((l: { name: string }) => l.name === "jdtls")).toBe(true);
  });

  test("supported LSPs include gopls", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(lsps.some((l: { name: string }) => l.name === "gopls")).toBe(true);
  });

  test("supported LSPs include clangd", async () => {
    const { listLsps } = await import(join(REPO, "packages", "lsp", "src", "index.ts"));
    const lsps = listLsps();
    expect(lsps.some((l: { name: string }) => l.name === "clangd")).toBe(true);
  });
});
