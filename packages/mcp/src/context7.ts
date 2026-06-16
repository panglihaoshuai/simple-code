// packages/mcp/src/context7.ts — Context7 MCP client

export interface Context7Client {
  queryDocs(query: string, libraryId: string): Promise<unknown>;
  resolveLibraryId(libraryName: string): Promise<string>;
}

export function createContext7Client(): Context7Client {
  return {
    async queryDocs(_query: string, _libraryId: string) {
      // Stub: forward to context7 MCP server
      return { note: "Context7 queryDocs stub" };
    },
    async resolveLibraryId(_libraryName: string) {
      // Stub: resolve library name to context7 ID
      return "/unknown/project";
    },
  };
}
