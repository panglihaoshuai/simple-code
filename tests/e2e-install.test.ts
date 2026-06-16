// T2.12: End-to-end test simulating first-time installation
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(process.cwd(), "dist", "cli.js");

let tmpDir: string;
let configPath: string;
let opencodeConfigPath: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-e2e-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
  configPath = join(tmpDir, "config.toml");
  opencodeConfigPath = join(tmpDir, "opencode.json");
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

function runInit(args: string[] = []): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("node", [CLI, "init", ...args], {
    env: { 
      ...process.env, 
      SIMPLE_CODE_CONFIG: configPath,
      HOME: tmpDir,
    },
    encoding: "utf-8",
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    status: r.status ?? -1,
  };
}

function createOpencodeConfig(): void {
  // Create the opencode config in the expected location (~/.config/opencode/opencode.json)
  const opencodeDir = join(tmpDir, ".config", "opencode");
  mkdirSync(opencodeDir, { recursive: true });
  writeFileSync(join(opencodeDir, "opencode.json"), JSON.stringify({ plugin: [] }, null, 2));
}

describe("T2.12: End-to-end first-time installation", () => {
  test("init detects opencode and adds simple-code plugin", () => {
    createOpencodeConfig();
    
    const r = runInit();
    
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("opencode found");
    expect(r.stdout).toContain("added 'simple-code'");
    expect(r.stdout).toContain("wrote default config");
    expect(existsSync(configPath)).toBe(true);
    
    // opencode.json is in ~/.config/opencode/opencode.json
    const opencodeDir = join(tmpDir, ".config", "opencode");
    const opencodeJsonPath = join(opencodeDir, "opencode.json");
    const opencodeConfig = JSON.parse(readFileSync(opencodeJsonPath, "utf-8"));
    expect(opencodeConfig.plugin).toContain("simple-code");
  });

  test("init creates config with all required sections", () => {
    createOpencodeConfig();
    
    const r = runInit();
    const configContent = readFileSync(configPath, "utf-8");
    
    expect(configContent).toContain("[net]");
    expect(configContent).toContain("[net.release]");
    expect(configContent).toContain("[net.llm]");
    expect(configContent).toContain("[net.lsp]");
    expect(configContent).toContain("[net.browser]");
    expect(configContent).toContain("[net.mcp]");
    expect(configContent).toContain("[net.upstream]");
    // upstream_tracking uses dotted sections like [upstream_tracking.agentmemory]
    expect(configContent).toContain("upstream_tracking");
    expect(configContent).toContain("[memory]");
    expect(configContent).toContain("[update]");
    expect(configContent).toContain("[lsp]");
    expect(configContent).toContain("[mcp]");
    expect(configContent).toContain("[telemetry]");
  });

  test("init sets China-friendly mirrors by default", () => {
    createOpencodeConfig();
    
    const r = runInit();
    const configContent = readFileSync(configPath, "utf-8");
    
    expect(configContent).toContain("ghproxy.com");
    expect(configContent).toContain("npmmirror.com");
    expect(configContent).toContain("api.openai-proxy.com");
    expect(configContent).toContain("gh-proxy.com");
  });

  test("init does not overwrite existing config", () => {
    createOpencodeConfig();
    
    writeFileSync(configPath, '[net]\nmirror = "https://custom.mirror/"');
    
    const r = runInit();
    
    expect(r.status).toBe(0);
    
    const configContent = readFileSync(configPath, "utf-8");
    expect(configContent).toContain("custom.mirror");
    expect(configContent).not.toContain("ghproxy.com");
  });

  test("init fails gracefully when opencode not found", () => {
    const r = runInit();
    
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("not found");
  });

  test("init handles missing opencode config directory", () => {
    const nestedDir = join(tmpDir, ".config", "opencode");
    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(nestedDir, "opencode.json"), JSON.stringify({ plugin: [] }));
    
    const r = runInit();
    
    expect(r.status).toBe(0);
    expect(existsSync(configPath)).toBe(true);
  });

  test("init prints help with --help flag", () => {
    const r = runInit(["--help"]);
    
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("simple-code init");
    expect(r.stdout).toContain("Steps:");
  });

  test("config show after init displays correct values", () => {
    createOpencodeConfig();
    
    runInit();
    
    const r = spawnSync("node", [CLI, "config", "show"], {
      env: { 
        ...process.env, 
        SIMPLE_CODE_CONFIG: configPath,
      },
      encoding: "utf-8",
    });
    
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("[net]");
    expect(r.stdout).toContain("[net.release]");
    expect(r.stdout).toContain("ghproxy.com");
  });

  test("config list shows all mirror keys", () => {
    createOpencodeConfig();
    
    runInit();
    
    const r = spawnSync("node", [CLI, "config", "list"], {
      env: { 
        ...process.env, 
        SIMPLE_CODE_CONFIG: configPath,
      },
      encoding: "utf-8",
    });
    
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("net.release.github_release");
    expect(r.stdout).toContain("net.llm.mirror");
    expect(r.stdout).toContain("net.lsp.mirror");
  });

  test("config get/set round-trip works after init", () => {
    createOpencodeConfig();
    
    runInit();
    
    const setR = spawnSync("node", [CLI, "config", "set", "net.mirror", "https://custom.mirror/"], {
      env: { 
        ...process.env, 
        SIMPLE_CODE_CONFIG: configPath,
      },
      encoding: "utf-8",
    });
    
    expect(setR.status).toBe(0);
    
    const getR = spawnSync("node", [CLI, "config", "get", "net.mirror"], {
      env: { 
        ...process.env, 
        SIMPLE_CODE_CONFIG: configPath,
      },
      encoding: "utf-8",
    });
    
    expect(getR.status).toBe(0);
    const value = getR.stdout.trim().replace(/^"|"$/g, '');
    expect(value).toBe("https://custom.mirror/");
  });
});
