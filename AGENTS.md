# AGENTS.md — for AI agents reading this repo

> This file is for AI agents (ClaudeCode, Codex, Aider, etc.) working inside the simple-code codebase. Humans should read README.md instead.

## What is simple-code?

An **opencode plugin** (not a fork). Single npm package `simple-code` exporting 28 lifecycle hooks + 5 MCPs + 5 LSP install commands + 8 UA /understand* commands.

## Hard rules

1. **Do not modify opencode upstream code.** This plugin integrates via opencode's plugin API; if you need opencode features, extend via hook or tool() — never vendor opencode source.
2. **Do not introduce Tauri / Go / dual-binary code paths.** Desktop is opencode's responsibility.
3. **Do not use `as any` / `eval` / dynamic require.** TypeScript strict mode is on (`noUncheckedIndexedAccess` etc.).
4. **Do not add postinstall / preinstall / prepare scripts to package.json.** All resources vendor at build time.
5. **Do not introduce telemetry.** `~/.simple-code/config.toml [telemetry].enabled` must stay `false` by default.

## 28 Lifecycle Hooks (opencode 1.17+)

| Event | simple-code handler |
|---|---|
| `command.executed` | memory observe |
| `file.edited` | memory observe |
| `file.watcher.updated` | (reserved) |
| `installation.updated` | (reserved) |
| `lsp.client.diagnostics` | memory observe |
| `lsp.updated` | (reserved) |
| `message.part.removed` | (reserved) |
| `message.part.updated` | memory observe |
| `message.removed` | (reserved) |
| `message.updated` | (reserved) |
| `permission.asked` | (reserved) |
| `permission.replied` | (reserved) |
| `server.connected` | (reserved) |
| `session.created` | memory load project profile |
| `session.compacted` | (reserved) |
| `session.deleted` | (reserved) |
| `session.diff` | trigger UA `/understand-diff` |
| `session.error` | (reserved) |
| `session.idle` | memory session end (compress + graph extract) |
| `session.status` | (reserved) |
| `session.updated` | (reserved) |
| `todo.updated` | (reserved) |
| `shell.env` | (reserved) |
| `tool.execute.after` | memory tool observe |
| `tool.execute.before` | memory tool observe |
| `tui.prompt.append` | (reserved) |
| `tui.command.execute` | UA command trigger (8 /understand* commands) |
| `tui.toast.show` | breaking change toast |

## Config (5 net segments, cargo .cargo/config.toml precedence)

```toml
# ~/.simple-code/config.toml
[net]
mirror = "https://ghproxy.com/"          # global fallback

[net.release]                            # npm packages
github_release = "https://ghproxy.com/..."
homebrew_bottle = "https://..."
npm_package = "https://registry.npmmirror.com"

[net.llm]                                # LLM API endpoint
mirror = "https://api.openai-proxy.com/v1"

[net.lsp]                                # LSP install
mirror = "https://gh-proxy.com/"

[net.browser]                            # chromium / playwright
mirror = "https://npmmirror.com/mirrors/playwright"

[net.mcp]                                # MCP server install
mirror = ""

[net.upstream]                           # maintainer fetch (not user)
git_clone = "https://ghproxy.com/..."
```

Resolution order: `component field` → `component mirror` → `global net.mirror` → empty (origin).

## Vendored upstream

- opencode v1.17.6 (consumer only, no fork)
- agentmemory v0.9.27 (vendored at `packages/companion/`)
- CodeGraph v1.0.1 (vendored via npm)
- Understand-Anything v2.7.3 (SKILL.md files at `vendored/skills/understand-anything/`)
- agent-skills v0.6.2 (SKILL.md files at `vendored/skills/agent-skills/`)

## B 档·标准 harness (3 skills)

Every task **must** go through:

1. **writing-plans** — drop `~/.hermes/plans/T<n.m>_<name>.md` with RED→GREEN→REFACTOR + Codex dual-stage checklist before coding
2. **test-driven-development** — RED test must run with `exit ≠ 0` **before** GREEN implementation. No "implement first, test later"
3. **subagent-driven-development** — ClaudeCode writes, Codex reviews (Stage 1 spec compliance, Stage 2 code quality). Both must PASS

## Plugin manifest

`packages/plugin/manifest.json` declares:
- `opencodeVersion`: `>=1.17.0 <2.0.0`
- 28 hooks
- 5 MCPs (context7 / playwright / webfetch / codegraph / agentmemory)
- `skills`: `./vendored/skills`
- `commands`: `./vendored/commands`

This file is consumed by `simple-code doctor`, not by opencode itself.

## Development commands

```bash
bun install                      # install deps
bun test                         # 18+ tests, all pass
bun run build                    # tsup → dist/index.js + dist/cli.js + .d.ts
bun run typecheck                # tsc --noEmit
bun run lint                     # tsc --noEmit (same as typecheck)
```

## Layout

```
simple-code/
├── src/
│   ├── index.ts                  # plugin entry (28 hooks)
│   ├── cli.ts                    # CLI router (bin = simple-code)
│   ├── config.ts                 # `simple-code config` subcommand
│   └── init.ts                   # `simple-code init` subcommand (M7)
├── packages/
│   ├── config/                   # ConfigLoader + MirrorResolver + Zod schema
│   ├── companion/                # simple-coded daemon wrapper (M4)
│   ├── mcp/                      # 5 MCP servers (M6)
│   ├── lsp/                      # 5 LSP install scripts (M6)
│   └── skills/                   # 8 UA + 24 agent-skills wrappers (M5)
├── vendored/
│   ├── agentmemory/              # iii engine + 22 hooks + 15 skills
│   └── skills/
│       ├── understand-anything/  # 8 SKILL.md
│       └── agent-skills/         # 24 SKILL.md
├── tests/                        # e2e + build + plugin manifest tests
└── docs/                         # install.md / mirror.md / upgrade.md
```

## License

MIT — see LICENSE. Plugin is not built by the OpenCode team.

## Skill routing (auto-invoke)

| 用户说 | 自动触发 |
|--------|----------|
| "这个 bug 怎么回事" / "为什么报错" | /investigate |
| "代码质量怎么样" / "健康检查" | /health |
| "这个项目是做什么的" / "解释一下代码" | /understand-chat |
| "测试一下" / "能用吗" | /qa |
| "发布" / "部署" | /ship |
| "审查一下" / "review" | /review |
