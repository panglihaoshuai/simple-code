# simple-code

> Zero-config opencode plugin: agentmemory + CodeGraph + UA + 24 agent-skills + 5 LSP + 3 MCP, all in one `npm i -g`.

simple-code is an opencode plugin (not a fork). Install once, get a fully-loaded coding + work agent with zero configuration.

## What you get

- **agentmemory** — persistent memory across sessions (12 auto-capture hooks, BM25 + vector + graph search, 95.2% R@5)
- **CodeGraph** — tree-sitter AST knowledge graph (38 languages, 0 LLM tokens, file watcher auto-sync)
- **Understand-Anything** — 8 `/understand*` commands (business / dashboard / LLM wiki analysis)
- **agent-skills** — 24 production-grade skills (DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP)
- **5 LSPs** — rust-analyzer / pyright / typescript / jdtls / gopls / clangd (on-demand install)
- **3 MCPs** — context7 (docs) / playwright (browser) / webfetch (HTTP)
- **opencode Zen free tier** — works without your own API key (100 req/day)
- **China-friendly mirrors** — default npmmirror + ghproxy, no setup needed
- **0 telemetry** — your code never leaves your machine

## Install

```bash
npm i -g simple-code
simple-code init
```

`init` writes `~/.config/opencode/opencode.json` plugin entry, starts the agentmemory daemon, and writes `~/.simple-code/config.toml` with sensible defaults.

## Use

```bash
opencode
```

Inside opencode you'll see:
- 28 lifecycle hooks (file edits, session events, tool calls, etc.) wired to agentmemory
- 5 LSPs auto-attached based on file extensions
- 3 MCPs (context7, playwright, webfetch) + 2 plugin-MCPs (codegraph, agentmemory)
- 8 `/understand*` commands (UA knowledge graph)
- 24 agent-skills in DEFINE→SHIP workflow

## Configure

```bash
simple-code config show          # print 5 net segments + upstream tracking + memory + LSP/MCP toggles
simple-code config set net.mirror https://ghproxy.com/
simple-code config set net.llm.mirror https://api.openai-proxy.com/v1
simple-code config unset lsp.rust
simple-code config list           # all keys
```

Edit `~/.simple-code/config.toml` directly also works.

## Update

```bash
simple-code update
```

Checks 4 upstream sources (agentmemory, CodeGraph, Understand-Anything, agent-skills). If a breaking change is pending, you'll see a `⚠ breaking change` toast with the CHANGELOG.

## Uninstall

```bash
simple-code uninstall
```

Stops the daemon, removes the plugin entry from `opencode.json`, backs up `~/.simple-code/config.toml`.

## Vendored upstream

- opencode v1.17.6 (we don't fork, we integrate via plugin)
- agentmemory v0.9.27
- CodeGraph v1.0.1
- Understand-Anything v2.7.3
- agent-skills v0.6.2

This plugin is **not** built by the OpenCode team. OpenCode is a registered trademark of Anomaly Innovations, Inc.

## License

MIT © 2026 panglihaoshuai
