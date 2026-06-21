// packages/codegraph/src/provider-factory.ts — Provider factory: managed → global-compat → lite → missing

import type { CodeGraphProvider } from "./provider-types.js";
import { FullCodeGraphProvider } from "./full-provider.js";
import { LiteCodeGraphProvider } from "./lite-provider.js";
import { resolveManagedRuntime } from "./managed-runtime.js";

export interface ProviderConfig {
  homeOverride?: string;
  preferLite?: boolean;
  allowGlobalCompat?: boolean;
}

export interface ProviderResolution {
  provider: CodeGraphProvider;
  mode: "full" | "lite" | "missing";
  source: "managed-private" | "global-compat" | "lite-ts-ast" | "missing";
  reason: string;
}

/**
 * Resolve which CodeGraph provider to use.
 * Priority: managed-private (~/.codegraph/) → global-compat (PATH) → lite TS/JS → missing
 */
export function resolveProvider(config: ProviderConfig = {}): ProviderResolution {
  // Lite-only mode
  if (config.preferLite) {
    return {
      provider: new LiteCodeGraphProvider(),
      mode: "lite",
      source: "lite-ts-ast",
      reason: "preferLite config set",
    };
  }

  // Try managed runtime (private or global-compat)
  const rt = resolveManagedRuntime({
    homeOverride: config.homeOverride,
    allowGlobalCompat: config.allowGlobalCompat ?? true,
  });

  if (rt.available && rt.executable) {
    return {
      provider: new FullCodeGraphProvider(),
      mode: "full",
      source: rt.source === "managed-private" ? "managed-private" : "global-compat",
      reason: `${rt.source}: ${rt.executable} (v${rt.version ?? "?"})`,
    };
  }

  // Fallback to Lite
  return {
    provider: new LiteCodeGraphProvider(),
    mode: "lite",
    source: "lite-ts-ast",
    reason: `no codegraph runtime available; using Lite TS/JS fallback`,
  };
}

/**
 * Check if managed runtime is available (not just global PATH).
 */
export function isManagedRuntimeAvailable(homeOverride?: string): boolean {
  const rt = resolveManagedRuntime({ homeOverride, allowGlobalCompat: false });
  return rt.available && rt.source === "managed-private";
}

/**
 * Check if any codegraph is available (managed or global).
 */
export function isUpstreamAvailable(homeOverride?: string): boolean {
  const rt = resolveManagedRuntime({ homeOverride, allowGlobalCompat: true });
  return rt.available;
}
