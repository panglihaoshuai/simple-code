// packages/mcp/src/playwright.ts — Playwright MCP client

export interface PlaywrightClient {
  navigate(url: string): Promise<void>;
  screenshot(): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
}

export function createPlaywrightClient(): PlaywrightClient {
  return {
    async navigate(_url: string) {
      // Stub: navigate browser
    },
    async screenshot() {
      // Stub: take screenshot
      return "data:image/png;base64,stub";
    },
    async click(_selector: string) {
      // Stub: click element
    },
    async type(_selector: string, _text: string) {
      // Stub: type text
    },
  };
}
