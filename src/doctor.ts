// src/doctor.ts — simple-code doctor: unified product completion check
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type CheckStatus = "pass" | "partial" | "missing" | "fail" | "unknown";

export type DoctorCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  required: boolean;
  evidence: string[];
  nextActions: string[];
};

export type DoctorResult = {
  overall: "PASS" | "PARTIAL" | "FAIL";
  checks: DoctorCheck[];
  missingTooling: DoctorCheck[];
  nextActions: string[];
};

// ─── Individual checks ───

function checkOpencode(): DoctorCheck {
  const r = spawnSync("which", ["opencode"], { encoding: "utf-8", timeout: 5000 });
  if (r.status === 0) {
    return { id: "opencode", label: "opencode CLI", status: "pass", required: true, evidence: ["found on PATH"], nextActions: [] };
  }
  return { id: "opencode", label: "opencode CLI", status: "fail", required: true, evidence: ["not found on PATH"], nextActions: ["Install opencode: https://opencode.ai"] };
}

function checkPluginConfig(): DoctorCheck {
  const home = process.env.HOME || "";
  const configPath = join(home, ".config", "opencode", "opencode.json");
  if (!existsSync(configPath)) {
    return { id: "plugin-config", label: "simple-code plugin configured", status: "missing", required: true, evidence: ["opencode.json not found"], nextActions: ["Run: simple-code init"] };
  }
  try {
    const raw = readFileSync(configPath, "utf-8");
    const cfg = JSON.parse(raw);
    if (Array.isArray(cfg.plugin) && cfg.plugin.includes("simple-code")) {
      return { id: "plugin-config", label: "simple-code plugin configured", status: "pass", required: true, evidence: ["simple-code in plugin array"], nextActions: [] };
    }
    return { id: "plugin-config", label: "simple-code plugin configured", status: "fail", required: true, evidence: ["simple-code not in plugin array"], nextActions: ["Run: simple-code init"] };
  } catch {
    return { id: "plugin-config", label: "simple-code plugin configured", status: "fail", required: true, evidence: ["opencode.json parse error"], nextActions: ["Fix or delete ~/.config/opencode/opencode.json"] };
  }
}

function checkConfigFile(): DoctorCheck {
  const home = process.env.HOME || "";
  const configPath = join(home, ".simple-code", "config.toml");
  if (existsSync(configPath)) {
    return { id: "config-file", label: "config.toml", status: "pass", required: true, evidence: ["~/.simple-code/config.toml exists"], nextActions: [] };
  }
  return { id: "config-file", label: "config.toml", status: "missing", required: true, evidence: ["~/.simple-code/config.toml not found"], nextActions: ["Run: simple-code init"] };
}

async function checkAgentmemory(): Promise<DoctorCheck> {
  const cli = spawnSync("which", ["agentmemory"], { encoding: "utf-8", timeout: 5000 });
  const cliOk = cli.status === 0;

  let httpOk = false;
  try {
    const res = await fetch("http://localhost:3111/health", { signal: AbortSignal.timeout(3000) });
    httpOk = res.ok;
  } catch {}

  const evidence: string[] = [];
  const nextActions: string[] = [];

  if (cliOk) evidence.push("CLI found on PATH");
  else evidence.push("CLI not found");

  if (httpOk) evidence.push("daemon reachable on :3111");
  else evidence.push("daemon not reachable");

  if (cliOk && httpOk) {
    return { id: "agentmemory", label: "agentmemory", status: "pass", required: true, evidence, nextActions };
  }
  if (cliOk || httpOk) {
    if (!cliOk) nextActions.push("Install agentmemory CLI: npm i -g agentmemory");
    if (!httpOk) nextActions.push("Start agentmemory daemon");
    return { id: "agentmemory", label: "agentmemory", status: "partial", required: true, evidence, nextActions };
  }
  return { id: "agentmemory", label: "agentmemory", status: "missing", required: true, evidence, nextActions: ["Install: npm i -g agentmemory", "Start daemon"] };
}

function checkCodeGraph(): DoctorCheck {
  const evidence: string[] = [];
  const nextActions: string[] = [];

  try {
    // Dynamic import to probe real capability
    const { getCodeGraphCapabilities } = require(join(process.cwd(), "packages", "codegraph", "src", "types.js"));
    const caps = getCodeGraphCapabilities();

    if (caps.parser === "typescript-ast") {
      evidence.push(`parser: ${caps.parser}`);
      evidence.push(`supported extensions: ${caps.supportedExtensions.join(", ")}`);
      evidence.push(`symbols: ${caps.supportsSymbols}, imports: ${caps.supportsImports}, exports: ${caps.supportsExports}`);
      evidence.push(`reference mode: ${caps.referenceMode}`);
      return { id: "codegraph", label: "CodeGraph", status: "pass", required: false, evidence, nextActions: ["Optional: add more language parsers"] };
    }

    if (caps.parser === "regex") {
      evidence.push("regex-only parser (no AST)");
      nextActions.push("Upgrade to AST-backed extraction (TypeScript Compiler API)");
      return { id: "codegraph", label: "CodeGraph", status: "partial", required: false, evidence, nextActions };
    }

    evidence.push("parser unavailable");
    nextActions.push("Implement CodeGraph symbol extraction");
    return { id: "codegraph", label: "CodeGraph", status: "missing", required: false, evidence, nextActions };
  } catch {
    // Module cannot load
    return { id: "codegraph", label: "CodeGraph", status: "missing", required: false, evidence: ["module cannot load"], nextActions: ["Implement CodeGraph symbol extraction"] };
  }
}

function checkUA(): DoctorCheck {
  const skillsDir = join(process.cwd(), "packages", "skills", "src", "index.ts");
  if (existsSync(skillsDir)) {
    return {
      id: "ua", label: "Understand-Anything", status: "missing", required: false,
      evidence: ["skills framework exists", "UA not vendored, no /understand commands"],
      nextActions: ["Vendor Understand-Anything: scripts/vendor-sync.sh --target understand-anything", "Register 8 /understand commands"],
    };
  }
  return { id: "ua", label: "Understand-Anything", status: "missing", required: false, evidence: ["not found"], nextActions: ["Implement UA integration"] };
}

function checkAgentSkills(): DoctorCheck {
  const skillsDir = join(process.cwd(), "packages", "skills", "src", "index.ts");
  if (existsSync(skillsDir)) {
    return {
      id: "agent-skills", label: "agent-skills", status: "missing", required: false,
      evidence: ["skills framework exists", "24 skills not vendored"],
      nextActions: ["Vendor agent-skills: scripts/vendor-sync.sh --target agent-skills", "Register 24 skills"],
    };
  }
  return { id: "agent-skills", label: "agent-skills", status: "missing", required: false, evidence: ["not found"], nextActions: ["Implement agent-skills integration"] };
}

function checkMCP(): DoctorCheck {
  const mcpDir = join(process.cwd(), "packages", "mcp", "src");
  const evidence: string[] = [];
  const nextActions: string[] = [];

  if (existsSync(join(mcpDir, "index.ts"))) evidence.push("MCP abstraction layer exists");
  if (existsSync(join(mcpDir, "stdio.ts"))) evidence.push("stdio transport exists");
  if (existsSync(join(mcpDir, "http.ts"))) evidence.push("http transport exists");
  if (existsSync(join(mcpDir, "context7.ts"))) evidence.push("context7 client stub exists");
  if (existsSync(join(mcpDir, "playwright.ts"))) evidence.push("playwright client stub exists");

  if (evidence.length === 0) {
    return { id: "mcp", label: "MCP", status: "missing", required: false, evidence: ["not found"], nextActions: ["Implement MCP integration"] };
  }

  nextActions.push("Connect real MCP servers (context7, playwright, webfetch)");
  return { id: "mcp", label: "MCP", status: "partial", required: false, evidence, nextActions };
}

function checkLSP(): DoctorCheck {
  const lspDir = join(process.cwd(), "packages", "lsp", "src");
  const evidence: string[] = [];
  const nextActions: string[] = [];

  if (existsSync(join(lspDir, "index.ts"))) evidence.push("LSP abstraction layer exists");
  if (existsSync(join(lspDir, "status.ts"))) evidence.push("LSP status detection exists");

  // Check which LSPs are actually installed
  const lsps = ["rust-analyzer", "pyright", "typescript-language-server", "jdtls", "gopls", "clangd"];
  const installed = lsps.filter(name => {
    const r = spawnSync("which", [name], { encoding: "utf-8", timeout: 3000 });
    return r.status === 0;
  });

  if (installed.length > 0) {
    evidence.push(`${installed.length}/${lsps.length} LSPs installed: ${installed.join(", ")}`);
  } else {
    evidence.push("0/6 LSPs installed");
  }

  if (evidence.length === 0) {
    return { id: "lsp", label: "LSP", status: "missing", required: false, evidence: ["not found"], nextActions: ["Implement LSP integration"] };
  }

  nextActions.push("Implement LSP install/download for missing languages");
  return { id: "lsp", label: "LSP", status: "partial", required: false, evidence, nextActions };
}

function checkBrowser(): DoctorCheck {
  return {
    id: "browser", label: "browser/chromium", status: "missing", required: false,
    evidence: ["not implemented"],
    nextActions: ["Implement browser/chromium status detection"],
  };
}

function checkDaemon(): DoctorCheck {
  let httpOk = false;
  try {
    const r = spawnSync("curl", ["-s", "http://localhost:13111/health"], { encoding: "utf-8", timeout: 3000 });
    httpOk = r.stdout?.includes('"status"') ?? false;
  } catch {}

  if (httpOk) {
    return { id: "daemon", label: "companion daemon", status: "pass", required: false, evidence: ["daemon reachable"], nextActions: [] };
  }

  return {
    id: "daemon", label: "companion daemon", status: "partial", required: false,
    evidence: ["daemon not running (starts with opencode)"],
    nextActions: ["Daemon auto-starts when opencode loads simple-code plugin"],
  };
}

function checkDocs(): DoctorCheck {
  const readme = join(process.cwd(), "README.md");
  const implStatus = join(process.cwd(), "docs", "implementation-status.md");
  const evidence: string[] = [];

  if (existsSync(readme)) {
    const content = readFileSync(readme, "utf-8");
    if (content.includes("WIP Prototype")) evidence.push("README correctly marked as WIP");
    else evidence.push("README exists (check WIP status)");
  }
  if (existsSync(implStatus)) evidence.push("implementation-status.md exists");

  return { id: "docs", label: "documentation", status: "partial", required: false, evidence, nextActions: ["Keep docs honest as features complete"] };
}

// ─── Main doctor function ───

export async function runDoctor(opts: { json?: boolean } = {}): Promise<void> {
  const result = await getDoctorResult();

  if (opts.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  // Human-readable output
  process.stdout.write("simple-code doctor\n\n");

  for (const c of result.checks) {
    const icon = c.status === "pass" ? "✅" : c.status === "partial" ? "⚠️" : c.status === "missing" ? "❌" : c.status === "fail" ? "❌" : "❓";
    const req = c.required ? " [required]" : " [optional]";
    process.stdout.write(`${icon} ${c.label}${req}\n`);
    for (const e of c.evidence) {
      process.stdout.write(`   ${e}\n`);
    }
    for (const a of c.nextActions) {
      process.stdout.write(`   → ${a}\n`);
    }
  }

  process.stdout.write(`\n═══════════════════════════════\n`);
  process.stdout.write(`Overall: ${result.overall}\n`);

  if (result.missingTooling.length > 0) {
    process.stdout.write(`\nMissing Tooling Report:\n`);
    for (const m of result.missingTooling) {
      process.stdout.write(`  ❌ ${m.label}: ${m.nextActions[0] ?? "see above"}\n`);
    }
  }

  if (result.nextActions.length > 0) {
    process.stdout.write(`\nNext Actions:\n`);
    for (const a of result.nextActions) {
      process.stdout.write(`  • ${a}\n`);
    }
  }
}

export async function getDoctorResult(): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];

  checks.push(checkOpencode());
  checks.push(checkPluginConfig());
  checks.push(checkConfigFile());
  checks.push(await checkAgentmemory());
  checks.push(checkCodeGraph());
  checks.push(checkUA());
  checks.push(checkAgentSkills());
  checks.push(checkMCP());
  checks.push(checkLSP());
  checks.push(checkBrowser());
  checks.push(checkDaemon());
  checks.push(checkDocs());

  const missingTooling = checks.filter(c => c.status === "missing" || c.status === "fail");
  const requiredFails = checks.filter(c => c.required && (c.status === "fail" || c.status === "missing"));
  const partials = checks.filter(c => c.status === "partial");

  let overall: "PASS" | "PARTIAL" | "FAIL";
  if (requiredFails.length > 0) {
    overall = "FAIL";
  } else if (partials.length > 0 || missingTooling.length > 0) {
    overall = "PARTIAL";
  } else {
    overall = "PASS";
  }

  const nextActions = checks
    .flatMap(c => c.nextActions)
    .filter((a, i, arr) => arr.indexOf(a) === i); // dedupe

  return { overall, checks, missingTooling, nextActions };
}
