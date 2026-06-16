// packages/mcp/src/stdio.ts — stdio MCP transport adapter

export interface StdioConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface Transport {
  send(message: unknown): Promise<void>;
  close(): Promise<void>;
}

export function createStdioTransport(config: StdioConfig): Transport {
  return {
    async send(_message: unknown) {
      // Stub: write to stdin of child process
    },
    async close() {
      // Stub: kill child process
    },
  };
}
