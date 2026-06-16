# simple-code Implementation Status

> Generated: 2026-06-15
> Codex Review: M1-M3 PASS, M4-M7 PARTIAL
> GitHub: https://github.com/panglihaoshuai/simple-code

---

## M4: agentmemory 薄集成 — PARTIAL

### T4.1 vendor 决策
- **现状**: 未实现
- **缺口**: 无 `vendor-sync.sh`，agentmemory 未 vendor 进 npm 包
- **验收标准**: `vendor-sync.sh --target agentmemory` 可执行，`vendored/agentmemory/` 包含 iii engine + sqlite + 22 hooks
- **最小 E2E**: 运行 vendor-sync.sh → 检查 `vendored/agentmemory/package.json` 存在 → `bun test` 通过

### T4.2 vendor-sync.sh
- **现状**: 未实现
- **缺口**: 无脚本文件
- **验收标准**: `script/vendor-sync.sh` 存在且可执行，支持 `--target agentmemory|understand-anything|agent-skills`
- **最小 E2E**: `bash script/vendor-sync.sh --target agentmemory` → exit 0 → 文件存在

### T4.3 simple-coded daemon
- **现状**: ✅ 实现完成
- **缺口**: 无
- **验收标准**: daemon 启动 → 端口避让 → POST /memory/observe → GET /health
- **最小 E2E**: `bun test packages/companion/tests/daemon.test.ts` → 5 pass

### T4.4 service templates
- **现状**: ✅ launchd/systemd/WinSW 模板存在
- **缺口**: 无
- **验收标准**: 3 个模板文件存在且结构正确
- **最小 E2E**: `bun test tests/service-management.test.ts` → 7 pass

### T4.5 plugin adapter
- **现状**: ✅ 28 hooks 实现
- **缺口**: 无（fire-and-forget 设计正确）
- **验收标准**: makeHooks() 返回 28 个 hook，POST 到 daemon
- **最小 E2E**: `bun test tests/plugin-adapter.test.ts` → 5 pass

### T4.6 E2E 测试
- **现状**: ✅ 测试存在（基于 daemon stub）
- **缺口**: 无真实 agentmemory recall 测试
- **验收标准**: session lifecycle → observe → health check
- **最小 E2E**: `bun test tests/e2e-session.test.ts` → 5 pass

### T4.7 uninstall
- **现状**: ✅ 测试存在
- **缺口**: 无 CLI 实现（仅测试逻辑）
- **验收标准**: `simple-code uninstall` 停 daemon + 删 plugin 项
- **最小 E2E**: `bun test tests/uninstall.test.ts` → 5 pass

### M4 阻塞项
- [ ] T4.1: 实现 vendor-sync.sh
- [ ] T4.2: vendor agentmemory 进包
- [ ] 真实 agentmemory daemon 集成（非 stub）

---

## M5: UA / CodeGraph / agent-skills — PARTIAL

### T5.1 vendor-sync UA
- **现状**: 未实现
- **缺口**: 无 vendor-sync.sh（同 T4.2）
- **验收标准**: `vendor-sync.sh --target understand-anything` → `vendored/skills/understand-anything/` 包含 8 SKILL.md
- **最小 E2E**: 运行 vendor-sync → 检查 SKILL.md 文件存在

### T5.2 vendor-sync agent-skills
- **现状**: 未实现
- **缺口**: 无 vendor-sync.sh（同 T4.2）
- **验收标准**: `vendor-sync.sh --target agent-skills` → `vendored/skills/agent-skills/` 包含 24 SKILL.md
- **最小 E2E**: 运行 vendor-sync → 检查 SKILL.md 文件存在

### T5.3 skills 框架
- **现状**: ✅ `packages/skills/src/index.ts` 实现
- **缺口**: 无
- **验收标准**: registerCommand/registerSkill/listCommands/listSkills 可用
- **最小 E2E**: `bun test tests/skills-framework.test.ts` → 6 pass

### T5.4 UA /understand × 8 命令
- **现状**: ⚠️ 框架在，无真实命令
- **缺口**: 8 个 `/understand*` 命令未注册
- **验收标准**: 运行 `/understand` → 扫描项目 → 生成 knowledge-graph.json
- **最小 E2E**: `simple-code /understand .` → exit 0 → `~/.simple-code/knowledge-graph.json` 存在

### T5.5 agent-skills 24 skill
- **现状**: ⚠️ 框架在，无真实 skill
- **缺口**: 24 个 skill 未注册
- **验收标准**: `simple-code skills list` → 显示 24 个 skill
- **最小 E2E**: 运行 list 命令 → 输出包含 "test-driven-development"

### T5.6 AGENTS.md
- **现状**: ✅ 已重写（plugin mode 描述）
- **缺口**: 无
- **验收标准**: AGENTS.md 包含 plugin mode、28 hooks、config 格式
- **最小 E2E**: 文件存在且内容正确

### T5.7 knowledge-graph 路径
- **现状**: ✅ 路径约定已定义
- **缺口**: 无真实 LLM 写入逻辑
- **验收标准**: `~/.simple-code/knowledge-graph.json` 路径正确，C 策略触发逻辑存在
- **最小 E2E**: `bun test tests/knowledge-graph.test.ts` → 4 pass

### T5.8 /understand-dashboard
- **现状**: ❌ 未实现
- **缺口**: 无静态 HTML 注入
- **验收标准**: `/understand-dashboard` 命令打开本地 HTML dashboard
- **最小 E2E**: 运行命令 → 浏览器打开 → 显示项目分析结果

### T5.9 skill tool 触发器
- **现状**: ❌ 未实现
- **缺口**: 无 prompt 意图识别
- **验收标准**: 用户输入触发对应 skill
- **最小 E2E**: 输入 "写个测试" → 自动触发 test-driven-development skill

### T5.10 E2E UA 测试
- **现状**: ❌ 未实现
- **缺口**: 无完整 UA 流程测试
- **验收标准**: 扫描 → precompute → 改文件 → post-commit → /understand-diff
- **最小 E2E**: 完整流程测试通过

### T5.11 CodeGraph MCP
- **现状**: ✅ `packages/mcp/src/codegraph.ts` 实现（stub）
- **缺口**: 无真实 tree-sitter 集成
- **验收标准**: codegraph_context + codegraph_explore 返回真实符号
- **最小 E2E**: 调用 tool → 返回函数/类/变量位置

### T5.12 CodeGraph MCP 注册
- **现状**: ✅ registerCodeGraphMcp() 实现
- **缺口**: 无真实 MCP server 注册
- **验收标准**: opencode.json MCP 段包含 codegraph
- **最小 E2E**: 启动 opencode → codegraph tools 可用

### M5 阻塞项
- [ ] T5.1: vendor Understand-Anything
- [ ] T5.2: vendor agent-skills
- [ ] T5.4: 注册 8 个 /understand 命令
- [ ] T5.5: 注册 24 个 agent-skill
- [ ] T5.8: 实现 /understand-dashboard
- [ ] T5.9: 实现 skill 触发器
- [ ] T5.10: UA E2E 测试
- [ ] T5.11: 真实 tree-sitter 集成

---

## M6: MCP / LSP — PARTIAL

### T6.1 MCP 抽象层
- **现状**: ✅ `packages/mcp/src/index.ts` 实现
- **缺口**: 无
- **验收标准**: createMcpClient/connect/disconnect/callTool/listTools 可用
- **最小 E2E**: `bun test tests/mcp-abstraction.test.ts` → 7 pass

### T6.2 stdio adapter
- **现状**: ✅ `packages/mcp/src/stdio.ts` 实现
- **缺口**: 无真实子进程管理
- **验收标准**: createStdioTransport/send/close 可用
- **最小 E2E**: `bun test tests/mcp-adapters.test.ts` → 3 pass

### T6.3 http adapter
- **现状**: ✅ `packages/mcp/src/http.ts` 实现
- **缺口**: 无真实 HTTP 调用
- **验收标准**: createHttpTransport/send/close 可用
- **最小 E2E**: `bun test tests/mcp-adapters.test.ts` → 3 pass

### T6.4 context7 client
- **现状**: ✅ `packages/mcp/src/context7.ts` 实现（stub）
- **缺口**: 无真实 context7 MCP 调用
- **验收标准**: queryDocs/resolveLibraryId 返回真实文档
- **最小 E2E**: 调用 queryDocs → 返回文档内容

### T6.5 playwright client
- **现状**: ✅ `packages/mcp/src/playwright.ts` 实现（stub）
- **缺口**: 无真实浏览器控制
- **验收标准**: navigate/screenshot/click/type 可用
- **最小 E2E**: navigate → screenshot → 返回 base64 图片

### T6.6 chromium vendor
- **现状**: ❌ 未实现
- **缺口**: 无 chromium-headless-shell 下载
- **验收标准**: 5 平台 chromium binary 可用
- **最小 E2E**: `simple-code browser install` → chromium 可执行

### T6.7 LSP 抽象层
- **现状**: ✅ `packages/lsp/src/index.ts` 实现
- **缺口**: 无
- **验收标准**: installLsp/listLsps/removeLsp 可用，支持 6 语言
- **最小 E2E**: `bun test tests/lsp-abstraction.test.ts` → 12 pass

### T6.8-T6.13 LSP vendor
- **现状**: ⚠️ 框架在，无真实下载
- **缺口**: 6 个 LSP binary 未下载
- **验收标准**: `simple-code lsp install rust-analyzer` → binary 可执行
- **最小 E2E**: install → `which rust-analyzer` → exit 0

### T6.14 LSP CLI
- **现状**: ⚠️ listLsps 可用，install/remove 是 stub
- **缺口**: 无真实安装逻辑
- **验收标准**: `simple-code lsp list` → 显示 6 个 LSP
- **最小 E2E**: list 命令 → 输出包含 "rust-analyzer"

### T6.15 E2E 测试
- **现状**: ❌ 未实现
- **缺口**: 无 MCP/LSP 完整流程测试
- **验收标准**: install LSP → 启动 → 诊断 → 关闭
- **最小 E2E**: 完整流程测试通过

### T6.16 install wrapper
- **现状**: ❌ 未实现
- **缺口**: 无 npm install 拦截器
- **验收标准**: postinstall 白名单放行，非白名单拒绝
- **最小 E2E**: `npm install simple-code` → 只安装白名单依赖

### M6 阻塞项
- [ ] T6.6: vendor chromium
- [ ] T6.8-T6.13: 实现 LSP 真实下载
- [ ] T6.14: LSP CLI install/remove 实现
- [ ] T6.15: MCP/LSP E2E 测试
- [ ] T6.16: install wrapper 实现

---

## M7: installer / key mode — PARTIAL

### T7.1 init CLI
- **现状**: ✅ `src/init.ts` 实现
- **缺口**: 无 daemon 自动启动（launchd/systemd）
- **验收标准**: `simple-code init` → 检测 opencode → patch opencode.json → 写 config.toml
- **最小 E2E**: `bun test tests/init.test.ts` → 10 pass

### T7.2 key mode 选择
- **现状**: ⚠️ 框架在，无完整 UI
- **缺口**: 无交互式 key 模式选择
- **验收标准**: init 第 2 步显示 key 模式选项（Zen free tier / 自有 key）
- **最小 E2E**: 运行 init → 显示选项 → 选择后继续

### T7.3 默认 config.toml
- **现状**: ✅ DEFAULT_CONFIG 包含 China-friendly mirrors
- **缺口**: 无
- **验收标准**: init 写入 config.toml 包含 5 段 net 配置
- **最小 E2E**: `bun test tests/e2e-install.test.ts` → 10 pass

### T7.4 uninstall CLI
- **现状**: ✅ 测试存在，逻辑正确
- **缺口**: 无 CLI 入口（src/cli.ts 未实现 uninstall 子命令）
- **验收标准**: `simple-code uninstall` 停 daemon + 删 plugin 项 + 备份 config
- **最小 E2E**: 运行 uninstall → opencode.json 无 simple-code → config.toml 存在

### T7.5 npm publish
- **现状**: ✅ package.json 配置正确
- **缺口**: 无 GitHub Actions workflow（因 scope 问题移除）
- **验收标准**: `npm publish` → 包可用
- **最小 E2E**: `npm pack` → 检查 tarball 内容

### M7 阻塞项
- [ ] T7.1: daemon 自动启动集成
- [ ] T7.2: key mode 交互式 UI
- [ ] T7.4: uninstall CLI 入口
- [ ] T7.5: GitHub Actions workflow（需 workflow scope）

---

## 总阻塞项汇总

### 高优先级（核心功能缺失）
1. **vendor-sync.sh**: T4.1, T4.2, T5.1, T5.2 共用，无此脚本无法 vendor 任何上游
2. **agentmemory 真实集成**: daemon 是 stub，无真实 memory engine
3. **UA 8 命令**: 框架在，无真实 /understand* 命令
4. **LSP 真实下载**: 框架在，无 binary 下载逻辑

### 中优先级（功能不完整）
5. **chromium vendor**: T6.6 未实现
6. **skill 触发器**: T5.9 未实现
7. **dashboard**: T5.8 未实现
8. **install wrapper**: T6.16 未实现

### 低优先级（测试/workflow）
9. **E2E 测试**: T5.10, T6.15 未实现
10. **GitHub Actions**: 需 workflow scope 才能推送

---

## 下一步建议

1. 实现 `vendor-sync.sh`（解锁 T4.1, T4.2, T5.1, T5.2）
2. vendor agentmemory 进包（解锁 M4 真实集成）
3. 实现 LSP 下载逻辑（解锁 T6.8-T6.13）
4. 注册 UA 命令 + agent-skills（解锁 T5.4, T5.5）
5. 申请 GitHub workflow scope → 推送 Actions
