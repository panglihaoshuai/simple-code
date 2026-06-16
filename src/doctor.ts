// src/doctor.ts — simple-code doctor: validate all components
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createProvider } from "../packages/agentmemory/src/index.js";

interface CheckResult {
  name: string;
  status: "PASS" | "PARTIAL" | "FAIL" | "SKIP";
  detail: string;
  action?: string;
}

async function checkOpencode(): Promise<CheckResult> {
  const r = spawnSync("which", ["opencode"], { encoding: "utf-8" });
  if (r.status !== 0) {
    return { name: "opencode", status: "FAIL", detail: "not found on PATH", action: "Install opencode: https://opencode.ai" };
  }
  return { name: "opencode", status: "PASS", detail: "found on PATH" };
}

function checkPluginConfig(): CheckResult {
  const home = process.env.HOME || "";
  const configPath = join(home, ".config", "opencode", "opencode.json");
  if (!existsSync(configPath)) {
    return { name: "plugin config", status: "FAIL", detail: "opencode.json not found", action: "Run: simple-code init" };
  }
  try {
    const raw = require("fs").readFileSync(configPath, "utf-8");
    const cfg = JSON.parse(raw);
    if (Array.isArray(cfg.plugin) && cfg.plugin.includes("simple-code")) {
      return { name: "plugin config", status: "PASS", detail: "simple-code in plugin array" };
    }
    return { name: "plugin config", status: "FAIL", detail: "simple-code not in plugin array", action: "Run: simple-code init" };
  } catch {
    return { name: "plugin config", status: "FAIL", detail: "opencode.json parse error" };
  }
}

function checkConfigFile(): CheckResult {
  const home = process.env.HOME || "";
  const configPath = join(home, ".simple-code", "config.toml");
  if (!existsSync(configPath)) {
    return { name: "config file", status: "FAIL", detail: "~/.simple-code/config.toml not found", action: "Run: simple-code init" };
  }
  return { name: "config file", status: "PASS", detail: "~/.simple-code/config.toml exists" };
}

async function checkAgentmemory(): Promise<CheckResult> {
  // CLI check
  const cli = spawnSync("which", ["agentmemory"], { encoding: "utf-8" });
  const cliOk = cli.status === 0;

  // HTTP check
  let httpOk = false;
  try {
    const res = await fetch("http://localhost:3111/health", { signal: AbortSignal.timeout(3000) });
    httpOk = res.ok;
  } catch {}

  if (cliOk && httpOk) {
    return { name: "agentmemory", status: "PASS", detail: "CLI found, daemon connected" };
  }
  if (cliOk) {
    return { name: "agentmemory", status: "PARTIAL", detail: "CLI found, daemon not reachable", action: "Start agentmemory daemon" };
  }
  if (httpOk) {
    return { name: "agentmemory", status: "PARTIAL", detail: "daemon reachable, CLI not found" };
  }
  return { name: "agentmemory", status: "FAIL", detail: "not available", action: "Install: npm i -g agentmemory" };
}

function checkCodeGraph(): CheckResult {
  const codegraphDir = join(process.cwd(), "packages", "mcp", "src", "codegraph.ts");
  if (existsSync(codegraphDir)) {
    return { name: "CodeGraph", status: "PARTIAL", detail: "MCP stub exists, real tree-sitter not integrated" };
  }
  return { name: "CodeGraph", status: "FAIL", detail: "not found" };
}

function checkUA(): CheckResult {
  const skillsDir = join(process.cwd(), "packages", "skills", "src", "index.ts");
  if (existsSync(skillsDir)) {
    return { name: "Understand-Anything", status: "PARTIAL", detail: "skills framework exists, UA commands not vendored" };
  }
  return { name: "Understand-Anything", status: "FAIL", detail: "not found" };
}

function checkAgentSkills(): CheckResult {
  const skillsDir = join(process.cwd(), "packages", "skills", "src", "index.ts");
  if (existsSync(skillsDir)) {
    return { name: "agent-skills", status: "PARTIAL", detail: "skills framework exists, 24 skills not vendored" };
  }
  return { name: "agent-skills", status: "FAIL", detail: "not found" };
}

function checkMCP(): CheckResult {
  const mcpDir = join(process.cwd(), "packages", "mcp", "src");
  if (existsSync(join(mcpDir, "index.ts"))) {
    return { name: "MCP", status: "PARTIAL", detail: "abstraction layer exists, real servers not connected" };
  }
  return { name: "MCP", status: "FAIL", detail: "not found" };
}

function checkLSP(): CheckResult {
  const lspDir = join(process.cwd(), "packages", "lsp", "src");
  if (existsSync(join(lspDir, "index.ts"))) {
    return { name: "LSP", status: "PARTIAL", detail: "abstraction layer exists, real binaries not installed" };
  }
  return { name: "LSP", status: "FAIL", detail: "not found" };
}

export async function runDoctor(): Promise<void> {
  process.stdout.write("simple-code doctor\n\n");

  const checks: CheckResult[] = [];

  checks.push(await checkOpencode());
  checks.push(checkPluginConfig());
  checks.push(checkConfigFile());
  checks.push(await checkAgentmemory());
  checks.push(checkCodeGraph());
  checks.push(checkUA());
  checks.push(checkAgentSkills());
  checks.push(checkMCP());
  checks.push(checkLSP());

  let passCount = 0;
  let partialCount = 0;
  let failCount = 0;

  for (const c of checks) {
    const icon = c.status === "PASS" ? "✅" : c.status === "PARTIAL" ? "⚠️" : "❌";
    process.stdout.write(`${icon} ${c.name}: ${c.detail}\n`);
    if (c.action) process.stdout.write(`   → ${c.action}\n`);

    if (c.status === "PASS") passCount++;
    else if (c.status === "PARTIAL") partialCount++;
    else failCount++;
  }

  process.stdout.write(`\nSummary: ${passCount} PASS, ${partialCount} PARTIAL, ${failCount} FAIL\n`);

  if (failCount > 0) {
    process.stdout.write("\nRun `simple-code init` to fix missing configuration.\n");
  }
}
