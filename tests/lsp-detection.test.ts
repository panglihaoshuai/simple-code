// T3.5: LSP upstream detection test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPTS_DIR = join(process.cwd(), "script");

let tmpDir: string;
let configPath: string;
let outputPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-lsp-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  configPath = join(tmpDir, "config.toml");
  outputPath = join(tmpDir, "upstream-status.json");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

function runUpstreamCheck(args: string[] = []): { stdout: string; stderr: string; status: number } {
  const scriptPath = join(SCRIPTS_DIR, "upstream-check.sh");
  const r = spawnSync("bash", [scriptPath, ...args], {
    env: { 
      ...process.env, 
      SIMPLE_CODE_CONFIG: configPath,
      UPSTREAM_STATUS_OUTPUT: outputPath,
    },
    encoding: "utf-8",
    timeout: 30000,
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    status: r.status ?? -1,
  };
}

describe("T3.5: LSP upstream detection", () => {
  test("check LSP component exists in output", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    expect(existsSync(outputPath)).toBe(true);
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    
    expect(data.components).toHaveProperty("lsp");
  });

  test("LSP has rust-analyzer entry", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.lsp).toHaveProperty("rust-analyzer");
  });

  test("LSP has pyright entry", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.lsp).toHaveProperty("pyright");
  });

  test("LSP has typescript-language-server entry", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.lsp).toHaveProperty("typescript-language-server");
  });

  test("LSP has jdtls entry", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.lsp).toHaveProperty("jdtls");
  });

  test("LSP has gopls entry", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.lsp).toHaveProperty("gopls");
  });

  test("LSP has clangd entry", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(data.components.lsp).toHaveProperty("clangd");
  });

  test("each LSP has current and latest fields", () => {
    writeFileSync(configPath, `[net]
mirror = "https://ghproxy.com/"`);
    
    runUpstreamCheck(["--check", "lsp"]);
    
    const data = JSON.parse(readFileSync(outputPath, "utf-8"));
    const lspEntries = ["rust-analyzer", "pyright", "typescript-language-server", "jdtls", "gopls", "clangd"];
    
    for (const lsp of lspEntries) {
      expect(data.components.lsp[lsp]).toHaveProperty("current");
      expect(data.components.lsp[lsp]).toHaveProperty("latest");
      expect(typeof data.components.lsp[lsp].current).toBe("string");
      expect(typeof data.components.lsp[lsp].latest).toBe("string");
    }
  });
});
