// T6.2 + T6.3: stdio and http MCP adapters test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T6.2: stdio MCP adapter", () => {
  test("stdio adapter file exists", () => {
    const stdioPath = join(REPO, "packages", "mcp", "src", "stdio.ts");
    expect(existsSync(stdioPath)).toBe(true);
  });

  test("stdio adapter exports createStdioTransport", async () => {
    const { createStdioTransport } = await import(join(REPO, "packages", "mcp", "src", "stdio.ts"));
    expect(typeof createStdioTransport).toBe("function");
  });

  test("stdio transport has send and close methods", async () => {
    const { createStdioTransport } = await import(join(REPO, "packages", "mcp", "src", "stdio.ts"));
    const transport = createStdioTransport({ command: "echo", args: ["test"] });
    expect(typeof transport.send).toBe("function");
    expect(typeof transport.close).toBe("function");
  });
});

describe("T6.3: http MCP adapter", () => {
  test("http adapter file exists", () => {
    const httpPath = join(REPO, "packages", "mcp", "src", "http.ts");
    expect(existsSync(httpPath)).toBe(true);
  });

  test("http adapter exports createHttpTransport", async () => {
    const { createHttpTransport } = await import(join(REPO, "packages", "mcp", "src", "http.ts"));
    expect(typeof createHttpTransport).toBe("function");
  });

  test("http transport has send and close methods", async () => {
    const { createHttpTransport } = await import(join(REPO, "packages", "mcp", "src", "http.ts"));
    const transport = createHttpTransport({ url: "http://localhost:3000" });
    expect(typeof transport.send).toBe("function");
    expect(typeof transport.close).toBe("function");
  });
});
