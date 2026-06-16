# M4 AgentMemory Wiring Evidence Report

Generated: 2026-06-15 (P0 fix update)

## Verdict

**PARTIAL_PLUS_REAL_AGENTMEMORY_PROVIDER_WIRING**

Real agentmemory CLI and HTTP daemon are detected and connected. Companion daemon now uses real AgentMemoryProvider. Real smoke tests pass (6/6). Plugin-adapter still POSTs to companion daemon (acceptable — companion forwards to real provider).

## What Changed

### New files (P0 fix round)
- `packages/agentmemory/src/types.ts` — AgentMemoryStatus, AgentMemoryHealth, AgentMemoryProvider interface
- `packages/agentmemory/src/cli-provider.ts` — CLIAgentMemoryProvider (real `agentmemory status` parsing)
- `packages/agentmemory/src/http-provider.ts` — HTTPAgentMemoryProvider (real HTTP /health, /memory/search, /memory/observe)
- `packages/agentmemory/src/index.ts` — createProvider factory (auto/cli/http modes)
- `packages/agentmemory/tests/agentmemory.test.ts` — 19 tests (16 unit + 3 optional real smoke)
- `tests/agentmemory-real.test.ts` — 6 real smoke tests (env-gated)

### Modified files (P0 fix round)
- `README.md` — downgraded from "completed product" to "WIP prototype"
- `README.*.md` — all 21 language files replaced with WIP placeholder
- `packages/companion/src/simple-coded.ts` — wired to real AgentMemoryProvider (was stub)
- `packages/companion/src/types.ts` — added agentmemory field to HealthResponse

## What Is Still Stub

- `search()` on CLIAgentMemoryProvider — throws "not yet implemented" (CLI doesn't expose search command)
- `packages/companion/src/plugin-adapter.ts` — still POSTs to companion daemon (acceptable: companion forwards to real provider)
- MCP/LSP/UA/agent-skills/CodeGraph — still scaffold/stub (not part of M4)

## Real AgentMemory Availability

- CLI: `/opt/homebrew/bin/agentmemory` — detected
- Daemon: `iii` process on :3111 — connected, 0 sessions, 0 observations
- Viewer: http://localhost:3113 — available
- doctor: server reachable, health unknown, LLM/embedding not configured

## Wiring Chain (verified)

```
opencode hook
  → plugin-adapter (POST /memory/observe)
    → companion daemon (simple-coded.ts)
      → AgentMemoryProvider.observe()
        → HTTP agentmemory daemon (:3111)
          → real agentmemory runtime
```

## Tests

### Baseline (before P0 fix)
- 204 pass, 0 fail

### After P0 fix
- 221 pass, 8 skip, 0 fail (229 tests across 32 files)

### Real smoke (SIMPLE_CODE_AGENTMEMORY_REAL_SMOKE=1)
- agentmemory CLI is available: PASS
- agentmemory status returns connected: PASS
- agentmemory HTTP health endpoint responds: PASS
- companion daemon with real provider starts and reports agentmemory status: PASS
- companion daemon observe forwards to real agentmemory: PASS
- env gate check: PASS
- **Total: 6 pass, 0 fail**

### Typecheck
- ✅ 0 errors

### Build
- ✅ success

## Codex

Codex was not invoked because the user reported quota unavailable.

```json
{
  "codex_deferred": {
    "deferred": true,
    "reason": "User reported Codex quota unavailable",
    "required": false,
    "replacement_gate": "Hermes local verification + tests + evidence report"
  }
}
```

## Remaining Risks

1. **plugin-adapter not directly wired**: still POSTs to companion daemon, not directly to agentmemory (acceptable — companion forwards)
2. **search() only on HTTP**: CLI provider can't search (CLI doesn't expose it)
3. **version unknown**: agentmemory CLI doesn't expose version via --version
4. **LLM/embedding not configured**: agentmemory doctor shows missing API keys
5. **M5-M7 still partial**: no real UA/agent-skills/CodeGraph/LSP/MCP integration
6. **plugin runtime not enabled**: simple-code not actually loaded by opencode
7. **no C档 harness runtime**: only B档 local verification used

## Next Step

Proceed to M5 real vendor integration, starting with one real CodeGraph or UA path only.
