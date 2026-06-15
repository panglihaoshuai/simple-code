// Upstream status schema (T3.7) — matches plan §M3.x upstream-status.json

export interface UpstreamComponentStatus {
  current: string;           // current vendored version
  latest: string;            // latest available version
  delta: "none" | "patch" | "minor" | "major";
  must_release: boolean;     // based on upstream-tracking.toml rules
  release_notes_url?: string;
  patch_count_since_last?: number;  // for patch threshold tracking
  new_skills?: string[];     // for UA / agent-skills: new skills added
  modified_skills?: string[]; // for UA / agent-skills: modified skills
  modified_count_since_last?: number;
  chromium_size_delta_pct?: number; // for playwright: chromium binary size change %
}

export interface LspComponentStatus {
  current: string;
  latest: string;
  delta: "none" | "patch" | "minor";
  must_release: boolean;
}

export interface UpstreamStatus {
  checked_at: string;        // ISO timestamp
  triggers_fired: string[];  // ["threshold_reached", "must_release", ...]
  components: {
    agentmemory: UpstreamComponentStatus;
    understand_anything: UpstreamComponentStatus;
    agent_skills: UpstreamComponentStatus;
    lsp: {
      "rust-analyzer": LspComponentStatus;
      pyright: LspComponentStatus;
      "typescript-language-server": LspComponentStatus;
      jdtls: LspComponentStatus;
      gopls: LspComponentStatus;
      clangd: LspComponentStatus;
    };
    playwright: UpstreamComponentStatus;
  };
  last_release_at: string;   // ISO timestamp of last simple-code release
  stale_days: number;        // days since last_release_at
  recommendation: "NO_RELEASE" | "RELEASE" | "CRITICAL_RELEASE";
  recommendation_reason: string;
}

// Default status for initial run (no prior data)
export const EMPTY_STATUS: UpstreamStatus = {
  checked_at: new Date().toISOString(),
  triggers_fired: [],
  components: {
    agentmemory: { current: "0.9.27", latest: "0.9.27", delta: "none", must_release: false },
    understand_anything: { current: "2.7.3", latest: "2.7.3", delta: "none", must_release: false },
    agent_skills: { current: "0.6.2", latest: "0.6.2", delta: "none", must_release: false },
    lsp: {
      "rust-analyzer": { current: "", latest: "", delta: "none", must_release: false },
      pyright: { current: "", latest: "", delta: "none", must_release: false },
      "typescript-language-server": { current: "", latest: "", delta: "none", must_release: false },
      jdtls: { current: "", latest: "", delta: "none", must_release: false },
      gopls: { current: "", latest: "", delta: "none", must_release: false },
      clangd: { current: "", latest: "", delta: "none", must_release: false },
    },
    playwright: { current: "1.47.0", latest: "1.47.0", delta: "none", must_release: false },
  },
  last_release_at: new Date().toISOString(),
  stale_days: 0,
  recommendation: "NO_RELEASE",
  recommendation_reason: "initial state",
};
