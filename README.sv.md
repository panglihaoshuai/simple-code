# simple-code (sv)

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

## Configure

```bash
simple-code config show
simple-code config set net.mirror https://ghproxy.com/
simple-code config set net.llm.mirror https://api.openai-proxy.com/v1
simple-code config unset lsp.rust
simple-code config list
```

## Update

```bash
simple-code update
```

## Uninstall

```bash
simple-code uninstall
```

## License

MIT © 2026 panglihaoshuai
