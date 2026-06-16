# simple-code

> **WIP Prototype** — Not production-ready. Do not npm publish.

An opencode plugin scaffold for integrating agentmemory, CodeGraph, Understand-Anything, agent-skills, LSP, and MCP into a single workflow.

## Current Status

| Milestone | Status | What Exists | What Is Missing |
|-----------|--------|-------------|-----------------|
| M1 | ✅ PASS | package.json, plugin manifest, src/index.ts, README 22lang, LICENSE | — |
| M2 | ✅ PASS | config package, Zod schema, ConfigLoader, MirrorResolver, CLI, init | — |
| M3 | ✅ PASS | upstream-check.sh, detection scripts, upstream-status.json | GitHub Actions (workflow scope) |
| M4 | ⚠️ PARTIAL | daemon stub, plugin adapter (28 hooks), service templates, uninstall | **agentmemory real wiring**, vendor-sync.sh |
| M5 | ⚠️ PARTIAL | skills framework, CodeGraph MCP stub, knowledge-graph paths | **UA 8 commands**, **agent-skills 24 skills**, real tree-sitter |
| M6 | ⚠️ PARTIAL | MCP abstraction (stdio/http), context7/playwright stubs, LSP abstraction | **Real MCP servers**, **LSP binary download**, chromium vendor |
| M7 | ⚠️ PARTIAL | init CLI, uninstall logic, config.toml defaults | key mode UI, daemon auto-start, GitHub Actions |

## Implemented

- Config system with Zod schema + China-friendly mirrors (ghproxy, npmmirror)
- Mirror resolver with 4-level cargo precedence
- `simple-code config` CLI (show/set/get/unset/list)
- `simple-code init` (detect opencode, patch config, write defaults)
- upstream-check.sh (agentmemory, UA, agent-skills, LSP, playwright detection)
- simple-coded daemon (port avoidance, /health, /memory/observe)
- plugin adapter (28 opencode lifecycle hooks → POST to daemon)
- service templates (launchd, systemd, WinSW)
- MCP abstraction layer (createMcpClient, stdio/http transports)
- LSP abstraction layer (listLsps, installLsp, removeLsp — 6 languages)
- skills framework (registerCommand, registerSkill)
- CodeGraph MCP stub (codegraph_context, codegraph_explore)

## Partial / Scaffolded

- agentmemory daemon is a stub (no real memory engine)
- UA commands framework exists but no real /understand* commands
- agent-skills framework exists but no real 24 skills registered
- CodeGraph MCP is a stub (no real tree-sitter analysis)
- LSP list/install/remove is a stub (no real binary download)
- MCP clients (context7, playwright) are stubs (no real server connection)
- init key mode selection UI is incomplete

## Planned (Not Implemented)

- vendor-sync.sh (agentmemory, UA, agent-skills vendor scripts)
- Real agentmemory integration (CLI/HTTP provider)
- Real CodeGraph tree-sitter analysis
- Real UA /understand* commands
- Real agent-skills (24 production-grade skills)
- Real LSP binary download + install
- Real MCP server connections (context7, playwright, webfetch)
- Chromium-headless-shell vendor (5 platforms)
- /understand-dashboard (static HTML)
- skill tool trigger (prompt intent recognition)
- install wrapper (npm install interceptor)
- GitHub Actions workflows (needs workflow scope)

## Quick Start

```bash
# Install (not published yet — clone and build)
git clone https://github.com/panglihaoshuai/simple-code.git
cd simple-code
bun install
bun run build

# Run tests
bun test

# Typecheck
bun run typecheck
```

## Architecture

```
simple-code/
├── src/                    # CLI + plugin entry
│   ├── index.ts            # opencode plugin entry (28 hook stubs)
│   ├── cli.ts              # simple-code CLI
│   ├── config.ts           # config subcommands
│   └── init.ts             # init flow
├── packages/
│   ├── config/             # Zod schema + ConfigLoader + MirrorResolver
│   ├── companion/          # simple-coded daemon + plugin adapter
│   ├── mcp/                # MCP abstraction + clients
│   ├── lsp/                # LSP abstraction
│   └── skills/             # skills framework
├── script/                 # upstream-check.sh
├── tests/                  # 204 tests across 30 files
└── docs/                   # mirror.md, implementation-status.md
```

## Testing

```bash
bun test                    # 204 pass, 0 fail
bun run typecheck           # 0 errors
bun run build               # success
```

## License

MIT

## Disclaimer

This is a **WIP prototype**, not a production-ready product. Many advertised features are scaffolded but not fully wired. See `docs/implementation-status.md` for detailed status.
