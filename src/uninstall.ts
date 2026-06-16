// src/uninstall.ts — simple-code uninstall: stop daemon + remove plugin entry
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";

export async function runUninstall(args: string[]): Promise<void> {
  const dryRun = args.includes("--dry-run");
  const home = process.env.HOME || "";

  process.stdout.write("simple-code uninstall\n\n");

  // Step 1: Stop daemon
  process.stdout.write("1. Stopping daemon...\n");
  const pkill = spawnSync("pkill", ["-f", "simple-coded"], { encoding: "utf-8", timeout: 5000 });
  if (pkill.status === 0) {
    process.stdout.write("   ✅ Daemon stopped\n");
  } else {
    process.stdout.write("   ⚠️ Daemon not running (ok)\n");
  }

  // Step 2: Remove from opencode.json
  process.stdout.write("2. Removing simple-code from opencode.json...\n");
  const configPath = join(home, ".config", "opencode", "opencode.json");
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      const cfg = JSON.parse(raw);
      if (Array.isArray(cfg.plugin)) {
        const before = cfg.plugin.length;
        cfg.plugin = cfg.plugin.filter((p: string) => p !== "simple-code");
        const after = cfg.plugin.length;
        if (!dryRun) {
          writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");
        }
        process.stdout.write(`   ✅ Removed simple-code (${before} → ${after} plugins)${dryRun ? " [dry-run]" : ""}\n`);
      } else {
        process.stdout.write("   ⚠️ No plugin array in opencode.json\n");
      }
    } catch (err) {
      process.stdout.write(`   ❌ Failed to read opencode.json: ${err}\n`);
    }
  } else {
    process.stdout.write("   ⚠️ opencode.json not found\n");
  }

  // Step 3: Backup config.toml (don't delete)
  process.stdout.write("3. Backing up config.toml...\n");
  const configToml = join(home, ".simple-code", "config.toml");
  if (existsSync(configToml)) {
    const backupPath = configToml + ".bak." + Date.now();
    if (!dryRun) {
      renameSync(configToml, backupPath);
    }
    process.stdout.write(`   ✅ Backed up to ${backupPath}${dryRun ? " [dry-run]" : ""}\n`);
  } else {
    process.stdout.write("   ⚠️ config.toml not found\n");
  }

  process.stdout.write("\nUninstall complete. simple-code plugin removed from opencode.\n");
  process.stdout.write("Note: ~/.simple-code/ directory preserved. Delete manually if desired.\n");
}
