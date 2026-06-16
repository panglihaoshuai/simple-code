// T6.4 + T6.5: context7 and playwright MCP clients test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T6.4: context7 MCP client", () => {
  test("context7 client file exists", () => {
    const ctx7Path = join(REPO, "packages", "mcp", "src", "context7.ts");
    expect(existsSync(ctx7Path)).toBe(true);
  });

  test("context7 client exports createContext7Client", async () => {
    const { createContext7Client } = await import(join(REPO, "packages", "mcp", "src", "context7.ts"));
    expect(typeof createContext7Client).toBe("function");
  });

  test("context7 client has queryDocs method", async () => {
    const { createContext7Client } = await import(join(REPO, "packages", "mcp", "src", "context7.ts"));
    const client = createContext7Client();
    expect(typeof client.queryDocs).toBe("function");
  });

  test("context7 client has resolveLibraryId method", async () => {
    const { createContext7Client } = await import(join(REPO, "packages", "mcp", "src", "context7.ts"));
    const client = createContext7Client();
    expect(typeof client.resolveLibraryId).toBe("function");
  });
});

describe("T6.5: playwright MCP client", () => {
  test("playwright client file exists", () => {
    const pwPath = join(REPO, "packages", "mcp", "src", "playwright.ts");
    expect(existsSync(pwPath)).toBe(true);
  });

  test("playwright client exports createPlaywrightClient", async () => {
    const { createPlaywrightClient } = await import(join(REPO, "packages", "mcp", "src", "playwright.ts"));
    expect(typeof createPlaywrightClient).toBe("function");
  });

  test("playwright client has navigate method", async () => {
    const { createPlaywrightClient } = await import(join(REPO, "packages", "mcp", "src", "playwright.ts"));
    const client = createPlaywrightClient();
    expect(typeof client.navigate).toBe("function");
  });

  test("playwright client has screenshot method", async () => {
    const { createPlaywrightClient } = await import(join(REPO, "packages", "mcp", "src", "playwright.ts"));
    const client = createPlaywrightClient();
    expect(typeof client.screenshot).toBe("function");
  });
});
