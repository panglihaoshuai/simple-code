# simple-code (繁體中文)

> 零設定的 opencode 外掛：agentmemory + CodeGraph + UA + 24 agent-skills + 5 LSP + 3 MCP，`npm i -g` 一鍵安裝。

simple-code 不是 opencode 的 fork，而是外掛。安裝一次，立即獲得完全載入的編碼 + 工作 agent。

## 包含功能

- **agentmemory** — 跨 session 持久記憶 (12 自動擷取 hook、BM25 + 向量 + 圖譜搜尋、95.2% R@5)
- **CodeGraph** — tree-sitter AST 知識圖譜 (38 種語言、0 LLM token、檔案監看自動同步)
- **Understand-Anything** — 8 個 `/understand*` 指令 (業務 / 儀表板 / LLM wiki 分析)
- **agent-skills** — 24 個生產級技能 (DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP)
- **5 個 LSP** — rust-analyzer / pyright / typescript / jdtls / gopls / clangd (按需安裝)
- **3 個 MCP** — context7 / playwright / webfetch
- **opencode Zen 免費額度** — 不需自備 API key (100 req/日)
- **大陸友好 mirror** — 預設 npmmirror + ghproxy
- **0 遙測** — 程式碼不出你的機器

## 安裝

```bash
npm i -g simple-code
simple-code init
```

## 設定

```bash
simple-code config show
simple-code config set net.mirror https://ghproxy.com/
```

## 授權

MIT © 2026 panglihaoshuai
