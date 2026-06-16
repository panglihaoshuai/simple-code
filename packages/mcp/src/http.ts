// packages/mcp/src/http.ts — http MCP transport adapter

export interface HttpConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface Transport {
  send(message: unknown): Promise<void>;
  close(): Promise<void>;
}

export function createHttpTransport(config: HttpConfig): Transport {
  return {
    async send(_message: unknown) {
      // Stub: POST to MCP server
    },
    async close() {
      // Stub: cleanup
    },
  };
}
