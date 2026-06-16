// packages/mcp/src/codegraph.ts — CodeGraph MCP server integration
// Provides codegraph_context + codegraph_explore tools for AI agent acceleration

const CODEGRAPH_CONFIG_DIR = ".simple-code/codegraph";

export interface CodeGraphTool {
  name: string;
  description: string;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export const codegraphContextTool: CodeGraphTool = {
  name: "codegraph_context",
  description: "Map code regions using tree-sitter AST. Zero LLM tokens. Returns function/class/variable locations.",
  handler: async (args) => {
    const { file, line } = args as { file?: string; line?: number };
    // Stub: real implementation will use tree-sitter
    return { file, line, symbols: [], note: "CodeGraph context stub — tree-sitter integration pending" };
  },
};

export const codegraphExploreTool: CodeGraphTool = {
  name: "codegraph_explore",
  description: "Explore symbol references and definitions across codebase. Zero LLM tokens.",
  handler: async (args) => {
    const { symbol } = args as { symbol?: string };
    // Stub: real implementation will use tree-sitter
    return { symbol, references: [], definitions: [], note: "CodeGraph explore stub — tree-sitter integration pending" };
  },
};

export function getCodeGraphConfigDir(): string {
  const home = process.env.HOME || "";
  return `${home}/${CODEGRAPH_CONFIG_DIR}`;
}

export function registerCodeGraphMcp(): { tools: CodeGraphTool[] } {
  return {
    tools: [codegraphContextTool, codegraphExploreTool],
  };
}
