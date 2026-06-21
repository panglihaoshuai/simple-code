// packages/mcp/src/codegraph.ts — CodeGraph MCP bridge using managed runtime
// Bridges OpenCode tool calls to managed CodeGraph runtime via runManagedCodegraph

import { runManagedCodegraph, resolveManagedRuntime } from "../../codegraph/src/managed-runtime.js";
import { resolveProvider } from "../../codegraph/src/provider-factory.js";

export interface CodeGraphTool {
  name: string;
  description: string;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export const codegraphExploreTool: CodeGraphTool = {
  name: "codegraph_explore",
  description: "Explore codebase: relevant symbols' source + call paths. Uses managed CodeGraph runtime.",
  handler: async (args) => {
    const { query, path } = args as { query?: string; path?: string };
    if (!query) return { error: "query is required" };
    const cwd = path ?? process.cwd();
    const r = runManagedCodegraph(["explore", query, "--path", cwd], cwd);
    if (r.exitCode !== 0) return { error: r.stderr || "explore failed", exitCode: r.exitCode };
    return { query, result: r.stdout, source: resolveManagedRuntime().source };
  },
};

export const codegraphSearchTool: CodeGraphTool = {
  name: "codegraph_search",
  description: "Search for symbols in the codebase. Uses managed CodeGraph runtime.",
  handler: async (args) => {
    const { search, path } = args as { search?: string; path?: string };
    if (!search) return { error: "search is required" };
    const cwd = path ?? process.cwd();
    const r = runManagedCodegraph(["query", search, "--path", cwd], cwd);
    if (r.exitCode !== 0) return { error: r.stderr || "search failed", exitCode: r.exitCode };
    return { search, result: r.stdout, source: resolveManagedRuntime().source };
  },
};

export const codegraphNodeTool: CodeGraphTool = {
  name: "codegraph_node",
  description: "Get one symbol's source + caller/callee trail. Uses managed CodeGraph runtime.",
  handler: async (args) => {
    const { name, path } = args as { name?: string; path?: string };
    if (!name) return { error: "name is required" };
    const cwd = path ?? process.cwd();
    const r = runManagedCodegraph(["node", name, "--path", cwd], cwd);
    if (r.exitCode !== 0) return { error: r.stderr || "node failed", exitCode: r.exitCode };
    return { name, result: r.stdout, source: resolveManagedRuntime().source };
  },
};

export const codegraphCallersTool: CodeGraphTool = {
  name: "codegraph_callers",
  description: "Find all callers of a symbol. Uses managed CodeGraph runtime.",
  handler: async (args) => {
    const { symbol, path } = args as { symbol?: string; path?: string };
    if (!symbol) return { error: "symbol is required" };
    const cwd = path ?? process.cwd();
    const r = runManagedCodegraph(["callers", symbol, "--path", cwd], cwd);
    if (r.exitCode !== 0) return { error: r.stderr || "callers failed", exitCode: r.exitCode };
    return { symbol, result: r.stdout, source: resolveManagedRuntime().source };
  },
};

export const codegraphStatusTool: CodeGraphTool = {
  name: "codegraph_status",
  description: "Check CodeGraph runtime status and project index health.",
  handler: async (args) => {
    const { path } = args as { path?: string };
    const cwd = path ?? process.cwd();
    const rt = resolveManagedRuntime();
    const { provider } = resolveProvider();
    const status = await provider.status(cwd);
    return {
      runtime: rt,
      status,
      source: rt.source,
    };
  },
};

export function getCodeGraphConfigDir(): string {
  const home = process.env.HOME || "";
  return `${home}/.simple-code/codegraph`;
}

export function registerCodeGraphMcp(): { tools: CodeGraphTool[] } {
  return {
    tools: [
      codegraphExploreTool,
      codegraphSearchTool,
      codegraphNodeTool,
      codegraphCallersTool,
      codegraphStatusTool,
    ],
  };
}
