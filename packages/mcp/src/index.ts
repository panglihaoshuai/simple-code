// packages/mcp/src/index.ts — MCP abstraction layer
// Provides unified interface for stdio and http MCP transports

export interface McpClientConfig {
  name: string;
  transport: "stdio" | "http";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
  listTools(): Promise<McpTool[]>;
}

export function createMcpClient(config: McpClientConfig): McpClient {
  return {
    async connect() {
      // Stub: real implementation will use stdio or http transport
    },
    async disconnect() {
      // Stub: cleanup
    },
    async callTool(_name: string, _args: Record<string, unknown>) {
      // Stub: forward to MCP server
      return { note: "MCP callTool stub" };
    },
    async listTools() {
      // Stub: query MCP server for available tools
      return [];
    },
  };
}
