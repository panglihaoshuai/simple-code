// T5.11 + T5.12: CodeGraph vendor + MCP server registration test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T5.11 + T5.12: CodeGraph MCP integration", () => {
  test("codegraph MCP server module exists", () => {
    const mcpPath = join(REPO, "packages", "mcp", "src", "codegraph.ts");
    expect(existsSync(mcpPath)).toBe(true);
  });

  test("codegraph MCP server exports tools", () => {
    const mcpPath = join(REPO, "packages", "mcp", "src", "codegraph.ts");
    if (existsSync(mcpPath)) {
      const content = require("fs").readFileSync(mcpPath, "utf-8");
      expect(content).toContain("codegraph_context");
      expect(content).toContain("codegraph_explore");
    }
  });

  test("codegraph config directory path is defined", () => {
    const mcpPath = join(REPO, "packages", "mcp", "src", "codegraph.ts");
    if (existsSync(mcpPath)) {
      const content = require("fs").readFileSync(mcpPath, "utf-8");
      expect(content).toContain(".simple-code/codegraph");
    }
  });

  test("MCP server has register function", () => {
    const mcpPath = join(REPO, "packages", "mcp", "src", "codegraph.ts");
    if (existsSync(mcpPath)) {
      const content = require("fs").readFileSync(mcpPath, "utf-8");
      expect(content).toContain("register");
    }
  });

  test("codegraph is integrated as MCP module (not npm vendor)", () => {
    // CodeGraph is integrated via packages/mcp/src/codegraph.ts
    // Not via npm package (codegraph npm is empty)
    const mcpPath = join(REPO, "packages", "mcp", "src", "codegraph.ts");
    expect(existsSync(mcpPath)).toBe(true);
  });
});
