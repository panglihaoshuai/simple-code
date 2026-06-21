// T5.11: CodeGraph integration via MCP module (not npm vendor)
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T5.11: CodeGraph integration", () => {
  test("codegraph is integrated via packages/mcp module", () => {
    const mcpPath = join(REPO, "packages", "mcp", "src", "codegraph.ts");
    expect(existsSync(mcpPath)).toBe(true);
  });

  test("codegraph MCP exports tools", async () => {
    const { registerCodeGraphMcp } = await import(join(REPO, "packages", "mcp", "src", "codegraph.ts"));
    const mcp = registerCodeGraphMcp();
    expect(mcp.tools.length).toBe(5);
    expect(mcp.tools[0].name).toBe("codegraph_explore");
    expect(mcp.tools[1].name).toBe("codegraph_search");
    expect(mcp.tools[2].name).toBe("codegraph_node");
    expect(mcp.tools[3].name).toBe("codegraph_callers");
    expect(mcp.tools[4].name).toBe("codegraph_status");
  });
});
