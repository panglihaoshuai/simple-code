import { z } from "zod";

// Mirror URL validation
const MirrorUrlSchema = z.string().url().or(z.literal(""));

// ─── Net segments (no .default() — defaults in DEFAULT_CONFIG) ───

export const NetSchema = z.object({
  // Global fallback (cargo .cargo/config.toml [net] base mirror)
  mirror: MirrorUrlSchema.optional(),
  release: z.object({
    enabled: z.boolean().optional(),
    mirror: MirrorUrlSchema.optional(),
    github_release: MirrorUrlSchema.optional(),
    homebrew_bottle: MirrorUrlSchema.optional(),
    npm_package: MirrorUrlSchema.optional(),
  }).optional(),
  llm: z.object({ mirror: MirrorUrlSchema.optional() }).optional(),
  lsp: z.object({ mirror: MirrorUrlSchema.optional() }).optional(),
  browser: z.object({ mirror: MirrorUrlSchema.optional() }).optional(),
  mcp: z.object({ mirror: MirrorUrlSchema.optional() }).optional(),
  upstream: z.object({
    git_clone: MirrorUrlSchema.optional(),
    github_release: MirrorUrlSchema.optional(),
  }).optional(),
});

export const UpstreamTrackingSchema = z.object({
  agentmemory: z.object({
    minor_bump: z.enum(["always", "never", "threshold"]).optional(),
    patch_threshold: z.number().int().min(1).optional(),
    poll_interval_hours: z.number().int().min(1).optional(),
  }).optional(),
  understand_anything: z.object({
    new_skill: z.enum(["always", "never", "threshold"]).optional(),
    modified_threshold: z.number().int().min(1).optional(),
    poll_interval_hours: z.number().int().min(1).optional(),
  }).optional(),
  agent_skills: z.object({
    new_skill: z.enum(["always", "never", "threshold"]).optional(),
    modified_threshold: z.number().int().min(1).optional(),
    poll_interval_hours: z.number().int().min(1).optional(),
  }).optional(),
  lsp: z.object({
    minor_bump: z.enum(["always", "never", "threshold"]).optional(),
    patch_threshold: z.number().int().min(1).optional(),
    poll_interval_hours: z.number().int().min(1).optional(),
  }).optional(),
  playwright: z.object({
    minor_bump: z.enum(["always", "never", "threshold"]).optional(),
    binary_size_delta_pct: z.number().min(0).optional(),
    patch_threshold: z.number().int().min(1).optional(),
    poll_interval_hours: z.number().int().min(1).optional(),
  }).optional(),
  global: z.object({
    auto_issue_on_release: z.boolean().optional(),
    issue_title_prefix: z.string().optional(),
    issue_labels: z.array(z.string()).optional(),
    issue_dedup_window_days: z.number().int().min(1).optional(),
    recommendation_triggers: z.array(z.string()).optional(),
  }).optional(),
});

export const MemorySchema = z.object({
  enabled: z.boolean().optional(),
  port: z.number().int().min(1024).max(65535).optional(),
  port_range_start: z.number().int().optional(),
  port_range_end: z.number().int().optional(),
}).optional();

export const UpdateSchema = z.object({
  check_on_start: z.boolean().optional(),
  auto_update: z.boolean().optional(),
  breaking_popup: z.boolean().optional(),
}).optional();

export const LspSchema = z.object({
  rust: z.boolean().optional(),
  python: z.boolean().optional(),
  typescript: z.boolean().optional(),
  java: z.boolean().optional(),
  go: z.boolean().optional(),
  c_cpp: z.boolean().optional(),
}).optional();

export const McpSchema = z.object({
  context7: z.boolean().optional(),
  playwright: z.boolean().optional(),
  webfetch: z.boolean().optional(),
  codegraph: z.boolean().optional(),
  agentmemory: z.boolean().optional(),
}).optional();

export const TelemetrySchema = z.object({
  enabled: z.boolean().optional(),
}).optional();

export const ConfigSchema = z.object({
  net: NetSchema.optional(),
  upstream_tracking: UpstreamTrackingSchema.optional(),
  memory: MemorySchema,
  update: UpdateSchema,
  lsp: LspSchema,
  mcp: McpSchema,
  telemetry: TelemetrySchema,
});

// ─── Hardcoded default config (Zod 4 nested default is broken) ───

interface DefaultConfig {
  net: {
    mirror?: string; // global fallback (cargo .cargo/config.toml [net] base)
    release: { enabled: boolean; mirror: string; github_release?: string; homebrew_bottle?: string; npm_package?: string };
    llm: { mirror: string };
    lsp: { mirror: string };
    browser: { mirror: string };
    mcp: { mirror: string };
    upstream: { git_clone: string; github_release: string };
  };
  upstream_tracking: {
    agentmemory: { minor_bump: "always" | "never" | "threshold"; patch_threshold: number; poll_interval_hours: number };
    understand_anything: { new_skill: "always" | "never" | "threshold"; modified_threshold: number; poll_interval_hours: number };
    agent_skills: { new_skill: "always" | "never" | "threshold"; modified_threshold: number; poll_interval_hours: number };
    lsp: { minor_bump: "always" | "never" | "threshold"; patch_threshold: number; poll_interval_hours: number };
    playwright: { minor_bump: "always" | "never" | "threshold"; binary_size_delta_pct: number; patch_threshold: number; poll_interval_hours: number };
    global: {
      auto_issue_on_release: boolean;
      issue_title_prefix: string;
      issue_labels: string[];
      issue_dedup_window_days: number;
      recommendation_triggers: string[];
    };
  };
  memory: { enabled: boolean; port: number; port_range_start: number; port_range_end: number };
  update: { check_on_start: boolean; auto_update: boolean; breaking_popup: boolean };
  lsp: { rust: boolean; python: boolean; typescript: boolean; java: boolean; go: boolean; c_cpp: boolean };
  mcp: { context7: boolean; playwright: boolean; webfetch: boolean; codegraph: boolean; agentmemory: boolean };
  telemetry: { enabled: boolean };
}

export const DEFAULT_CONFIG: DefaultConfig = {
  net: {
    release: { enabled: true, mirror: "" },
    llm: { mirror: "" },
    lsp: { mirror: "https://gh-proxy.com/" },
    browser: { mirror: "https://npmmirror.com/mirrors/playwright" },
    mcp: { mirror: "" },
    upstream: { git_clone: "", github_release: "" },
  },
  upstream_tracking: {
    agentmemory: { minor_bump: "threshold", patch_threshold: 3, poll_interval_hours: 24 },
    understand_anything: { new_skill: "threshold", modified_threshold: 3, poll_interval_hours: 24 },
    agent_skills: { new_skill: "threshold", modified_threshold: 5, poll_interval_hours: 24 },
    lsp: { minor_bump: "always", patch_threshold: 3, poll_interval_hours: 168 },
    playwright: { minor_bump: "always", binary_size_delta_pct: 5, patch_threshold: 3, poll_interval_hours: 168 },
    global: {
      auto_issue_on_release: true,
      issue_title_prefix: "[upstream]",
      issue_labels: ["upstream", "maintenance"],
      issue_dedup_window_days: 30,
      recommendation_triggers: ["must_release", "threshold_reached", "stale_30d"],
    },
  },
  memory: { enabled: true, port: 3111, port_range_start: 3111, port_range_end: 3119 },
  update: { check_on_start: true, auto_update: false, breaking_popup: true },
  lsp: { rust: true, python: true, typescript: true, java: true, go: true, c_cpp: true },
  mcp: { context7: true, playwright: true, webfetch: true, codegraph: true, agentmemory: true },
  telemetry: { enabled: false },
};

export type Config = DefaultConfig;
export type NetConfig = DefaultConfig["net"];
export type UpstreamTrackingConfig = DefaultConfig["upstream_tracking"];
