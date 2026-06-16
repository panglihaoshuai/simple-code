// T6.1: MCP abstraction layer test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T6.1: MCP abstraction layer", () => {
  test("packages/mcp directory exists", () => {
    const mcpDir = join(REPO, "packages", "mcp");
    expect(existsSync(mcpDir)).toBe(true);
  });

  test("packages/mcp has index.ts", () => {
    const indexPath = join(REPO, "packages", "mcp", "src", "index.ts");
    expect(existsSync(indexPath)).toBe(true);
  });

  test("MCP index exports createMcpClient function", async () => {
    const { createMcpClient } = await import(join(REPO, "packages", "mcp", "src", "index.ts"));
    expect(typeof createMcpClient).toBe("function");
  });

  test("MCP index exports McpClient type", async () => {
    const mod = await import(join(REPO, "packages", "mcp", "src", "index.ts"));
    expect(mod).toHaveProperty("createMcpClient");
  });

  test("MCP client has connect method", async () => {
    const { createMcpClient } = await import(join(REPO, "packages", "mcp", "src", "index.ts"));
    const client = createMcpClient({ name: "test", transport: "stdio" });
    expect(typeof client.connect).toBe("function");
  });

  test("MCP client has disconnect method", async () => {
    const { createMcpClient } = await import(join(REPO, "packages", "mcp", "src", "index.ts"));
    const client = createMcpClient({ name: "test", transport: "stdio" });
    expect(typeof client.disconnect).toBe("function");
  });

  test("MCP client has callTool method", async () => {
    const { createMcpClient } = await import(join(REPO, "packages", "mcp", "src", "index.ts"));
    const client = createMcpClient({ name: "test", transport: "stdio" });
    expect(typeof client.callTool).toBe("function");
  });
});
