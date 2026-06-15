// upstream-check.sh.ts — Bun script: scan 4 upstream sources + 5 LSP + playwright
// Usage: bun run script/upstream-tracker/upstream-check.sh.ts [--issue] [--json]
// Output: generated/upstream-status.json

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { UpstreamStatus, UpstreamComponentStatus, LspComponentStatus } from "./upstream-status.js";

const GITHUB_API = "https://api.github.com";
const NPM_REGISTRY = "https://registry.npmjs.org";

// ─── Config (read from upstream-tracking.toml defaults) ───

interface UpstreamConfig {
  agentmemory: { minor_bump: "always" | "threshold"; patch_threshold: number };
  understand_anything: { new_skill: "always" | "threshold"; modified_threshold: number };
  agent_skills: { new_skill: "always" | "threshold"; modified_threshold: number };
  lsp: { minor_bump: "always" | "threshold"; patch_threshold: number };
  playwright: { minor_bump: "always" | "threshold"; binary_size_delta_pct: number };
}

const DEFAULT_CONFIG: UpstreamConfig = {
  agentmemory: { minor_bump: "always", patch_threshold: 3 },
  understand_anything: { new_skill: "always", modified_threshold: 3 },
  agent_skills: { new_skill: "always", modified_threshold: 5 },
  lsp: { minor_bump: "always", patch_threshold: 3 },
  playwright: { minor_bump: "always", binary_size_delta_pct: 5 },
};

// ─── Version comparison helpers ───

function parseVersion(v: string): { major: number; minor: number; patch: number } {
  const cleaned = v.replace(/^v/, "").split(/[-+]/)[0] ?? "";
  const [majs, minors, patches] = cleaned.split(".");
  return { major: parseInt(majs ?? "0") || 0, minor: parseInt(minors ?? "0") || 0, patch: parseInt(patches ?? "0") || 0 };
}

function versionDelta(current: string, latest: string): "none" | "patch" | "minor" | "major" {
  const c = parseVersion(current);
  const l = parseVersion(latest);
  if (c.major !== l.major) return "major";
  if (c.minor !== l.minor) return "minor";
  if (c.patch !== l.patch) return "patch";
  return "none";
}

function mustRelease(delta: "none" | "patch" | "minor" | "major", policy: "always" | "threshold", patchThreshold: number, patchCount: number): boolean {
  if (delta === "major") return true;
  if (policy === "always" && (delta === "minor" || delta === "major")) return true;
  if (delta === "patch" && patchCount >= patchThreshold) return true;
  return false;
}

// ─── Fetch helpers ───

async function fetchNpmLatest(pkg: string): Promise<{ version: string; time: string }> {
  const res = await fetch(`${NPM_REGISTRY}/${pkg}/latest`);
  if (!res.ok) throw new Error(`npm ${pkg}: ${res.status}`);
  const data = await res.json() as { version: string; time?: Record<string, string> };
  return { version: data.version, time: data.time?.[data.version] ?? "" };
}

async function fetchGithubRelease(owner: string, repo: string): Promise<{ tag: string; url: string; published: string }> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "simple-code-upstream-check" },
  });
  if (!res.ok) throw new Error(`github ${owner}/${repo}: ${res.status}`);
  const data = await res.json() as { tag_name: string; html_url: string; published_at: string };
  return { tag: data.tag_name, url: data.html_url, published: data.published_at };
}

// ─── Per-source check functions (T3.2-T3.6) ───

async function checkAgentmemory(current: string, cfg: UpstreamConfig): Promise<UpstreamComponentStatus> {
  const { version } = await fetchNpmLatest("@agentmemory/agentmemory");
  const delta = versionDelta(current, version);
  return {
    current,
    latest: version,
    delta,
    must_release: mustRelease(delta, cfg.agentmemory.minor_bump, cfg.agentmemory.patch_threshold, 0),
  };
}

async function checkUA(current: string, cfg: UpstreamConfig): Promise<UpstreamComponentStatus> {
  const { tag } = await fetchGithubRelease("Egonex-AI", "Understand-Anything");
  const latestClean = tag.replace(/^v/, "");
  const delta = versionDelta(current, latestClean);
  return {
    current,
    latest: latestClean,
    delta,
    must_release: mustRelease(delta, cfg.understand_anything.new_skill === "always" ? "always" : "threshold", 1, 0),
    release_notes_url: `https://github.com/Egonex-AI/Understand-Anything/releases/tag/${tag}`,
  };
}

async function checkAgentSkills(current: string, cfg: UpstreamConfig): Promise<UpstreamComponentStatus> {
  const { tag } = await fetchGithubRelease("addyosmani", "agent-skills");
  const latestClean = tag.replace(/^v/, "");
  const delta = versionDelta(current, latestClean);
  return {
    current,
    latest: latestClean,
    delta,
    must_release: mustRelease(delta, cfg.agent_skills.new_skill === "always" ? "always" : "threshold", 1, 0),
    release_notes_url: `https://github.com/addyosmani/agent-skills/releases/tag/${tag}`,
  };
}

async function checkLsp(): Promise<Record<string, LspComponentStatus>> {
  // Placeholder: each LSP needs its own release check (GitHub / npm)
  // For now return stubs with empty versions
  const names = ["rust-analyzer", "pyright", "typescript-language-server", "jdtls", "gopls", "clangd"];
  const result: Record<string, LspComponentStatus> = {};
  for (const name of names) {
    result[name] = { current: "", latest: "", delta: "none", must_release: false };
  }
  return result;
}

async function checkPlaywright(current: string, cfg: UpstreamConfig): Promise<UpstreamComponentStatus> {
  const { version } = await fetchNpmLatest("@playwright/test");
  const delta = versionDelta(current, version);
  return {
    current,
    latest: version,
    delta,
    must_release: mustRelease(delta, cfg.playwright.minor_bump, 3, 0),
  };
}

// ─── Main (T3.1: main framework) ───

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const issueFlag = args.includes("--issue");
  const jsonFlag = args.includes("--json");

  const cfg = DEFAULT_CONFIG;
  const now = new Date().toISOString();

  const [agentmemory, ua, agentSkills, lsp, playwright] = await Promise.all([
    checkAgentmemory("0.9.27", cfg),
    checkUA("2.7.3", cfg),
    checkAgentSkills("0.6.2", cfg),
    checkLsp(),
    checkPlaywright("1.47.0", cfg),
  ]);

  // Determine triggers
  const triggers: string[] = [];
  if (agentmemory.must_release || ua.must_release || agentSkills.must_release || playwright.must_release) {
    triggers.push("threshold_reached");
  }

  // Recommendation
  const anyMustRelease = agentmemory.must_release || ua.must_release || agentSkills.must_release || playwright.must_release;
  const staleDays = 0; // TODO: read last simple-code release date
  const recommendation = anyMustRelease ? "RELEASE" : staleDays > 30 ? "CRITICAL_RELEASE" : "NO_RELEASE";

  const reasons: string[] = [];
  if (agentmemory.must_release) reasons.push(`agentmemory ${agentmemory.delta}`);
  if (ua.must_release) reasons.push(`UA ${ua.delta}`);
  if (agentSkills.must_release) reasons.push(`agent-skills ${agentSkills.delta}`);
  if (playwright.must_release) reasons.push(`playwright ${playwright.delta}`);

  const status: UpstreamStatus = {
    checked_at: now,
    triggers_fired: triggers,
    components: { agentmemory, understand_anything: ua, agent_skills: agentSkills, lsp, playwright },
    last_release_at: now,
    stale_days: staleDays,
    recommendation,
    recommendation_reason: reasons.length > 0 ? reasons.join(" + ") : "all up-to-date",
  };

  // Write output (T3.7)
  const outDir = join(process.cwd(), "generated");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "upstream-status.json"), JSON.stringify(status, null, 2));

  if (jsonFlag) {
    process.stdout.write(JSON.stringify(status, null, 2));
  } else {
    process.stdout.write(`upstream check complete: ${status.recommendation}\n`);
    process.stdout.write(`  agentmemory: ${agentmemory.current} → ${agentmemory.latest} (${agentmemory.delta}) must_release=${agentmemory.must_release}\n`);
    process.stdout.write(`  UA:          ${ua.current} → ${ua.latest} (${ua.delta}) must_release=${ua.must_release}\n`);
    process.stdout.write(`  agent-skills:${agentSkills.current} → ${agentSkills.latest} (${agentSkills.delta}) must_release=${agentSkills.must_release}\n`);
    process.stdout.write(`  playwright:  ${playwright.current} → ${playwright.latest} (${playwright.delta}) must_release=${playwright.must_release}\n`);
    process.stdout.write(`  recommendation: ${recommendation} — ${status.recommendation_reason}\n`);
  }

  // Issue creation stub (T3.8)
  if (issueFlag && anyMustRelease) {
    process.stdout.write(`\n[note] would create GitHub issue: "${status.recommendation_reason}"\n`);
    // TODO: gh issue create --title "[upstream] ${status.recommendation_reason}" --body "..." --label upstream,maintenance
  }
}

main().catch((err) => {
  process.stderr.write(`upstream-check: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
