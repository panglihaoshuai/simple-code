// packages/codegraph/src/managed-runtime.ts — Managed CodeGraph runtime resolver
// Resolves codegraph binary from ~/.codegraph/versions/ private directory
// Does NOT depend on global PATH

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

export type ManagedRuntimeSource =
  | "managed-private"    // ~/.codegraph/versions/<version>/
  | "project-local"      // .codegraph/ in project root
  | "global-compat"      // system PATH (compatibility only)
  | "missing";

export interface ManagedRuntimeStatus {
  available: boolean;
  source: ManagedRuntimeSource;
  version?: string;
  executable?: string;
  runtimeRoot?: string;
  verified: boolean;
  reason?: string;
}

const VERSIONS_DIR_NAME = "versions";

/**
 * Resolve the private managed runtime directory.
 * Default: ~/.codegraph/versions/
 */
function getVersionsDir(homeOverride?: string): string {
  const home = homeOverride ?? homedir();
  return join(home, ".codegraph", VERSIONS_DIR_NAME);
}

/**
 * Find the latest installed version in the private runtime directory.
 */
function findLatestVersion(versionsDir: string): string | undefined {
  if (!existsSync(versionsDir)) return undefined;
  try {
    const entries = readdirSync(versionsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith("v"))
      .map(d => d.name)
      .sort((a, b) => b.localeCompare(a)); // descending semver-ish
    return entries[0];
  } catch {
    return undefined;
  }
}

/**
 * Resolve the codegraph executable from a managed runtime root.
 * Returns the shell wrapper path (bin/codegraph) which self-resolves the bundled Node.
 */
function resolveExecutable(runtimeRoot: string): string | undefined {
  const binPath = join(runtimeRoot, "bin", "codegraph");
  if (existsSync(binPath)) return binPath;
  // fallback: lib/dist/bin/codegraph.js (direct JS entry)
  const jsPath = join(runtimeRoot, "lib", "dist", "bin", "codegraph.js");
  if (existsSync(jsPath)) return jsPath;
  return undefined;
}

/**
 * Get version from the runtime root.
 */
function getVersion(runtimeRoot: string): string | undefined {
  const pkgJson = join(runtimeRoot, "lib", "package.json");
  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, "utf-8"));
      return pkg.version;
    } catch {}
  }
  // fallback: check node --version or codegraph.js version
  const binPath = resolveExecutable(runtimeRoot);
  if (binPath) {
    const r = spawnSync(binPath, ["--version"], { encoding: "utf-8", timeout: 5000, shell: false });
    if (r.status === 0) {
      const m = (r.stdout ?? "").match(/(\d+\.\d+\.\d+)/);
      return m?.[1];
    }
  }
  return undefined;
}

/**
 * Verify the executable actually works.
 */
function verifyExecutable(executable: string): { ok: boolean; version?: string; error?: string } {
  try {
    const r = spawnSync(executable, ["--version"], { encoding: "utf-8", timeout: 10000, shell: false });
    if (r.status !== 0) return { ok: false, error: `exit ${r.status}: ${r.stderr}` };
    const m = (r.stdout ?? "").match(/(\d+\.\d+\.\d+)/);
    return { ok: true, version: m?.[1] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Resolve managed CodeGraph runtime.
 * Priority: managed-private (~/.codegraph/) → global-compat (PATH) → missing
 */
export function resolveManagedRuntime(options?: {
  homeOverride?: string;
  allowGlobalCompat?: boolean;
}): ManagedRuntimeStatus {
  const versionsDir = getVersionsDir(options?.homeOverride);

  // Try managed private runtime first
  const version = findLatestVersion(versionsDir);
  if (version) {
    const runtimeRoot = join(versionsDir, version);
    const executable = resolveExecutable(runtimeRoot);
    if (executable) {
      const v = getVersion(runtimeRoot);
      return {
        available: true,
        source: "managed-private",
        version: v ?? version,
        executable,
        runtimeRoot,
        verified: true,
      };
    }
  }

  // Fallback: global PATH (compatibility only)
  if (options?.allowGlobalCompat !== false) {
    const which = spawnSync("which", ["codegraph"], { encoding: "utf-8", timeout: 5000, shell: false });
    if (which.status === 0 && which.stdout?.trim()) {
      const globalBin = which.stdout.trim();
      const vResult = verifyExecutable(globalBin);
      if (vResult.ok) {
        return {
          available: true,
          source: "global-compat",
          version: vResult.version,
          executable: globalBin,
          verified: true,
          reason: "using global PATH codegraph (not managed by simple-code)",
        };
      }
    }
  }

  return {
    available: false,
    source: "missing",
    verified: false,
    reason: `no codegraph found in ${versionsDir} or PATH`,
  };
}

/**
 * Run a codegraph command using the managed runtime.
 * Returns { stdout, stderr, exitCode }.
 */
export function runManagedCodegraph(
  args: string[],
  cwd: string,
  options?: { homeOverride?: string; timeoutMs?: number }
): { stdout: string; stderr: string; exitCode: number } {
  const status = resolveManagedRuntime({ homeOverride: options?.homeOverride });
  if (!status.available || !status.executable) {
    return { stdout: "", stderr: "codegraph runtime not available", exitCode: -1 };
  }

  const r = spawnSync(status.executable, args, {
    cwd,
    encoding: "utf-8",
    timeout: options?.timeoutMs ?? 30000,
    shell: false,
  });

  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    exitCode: r.status ?? -1,
  };
}
