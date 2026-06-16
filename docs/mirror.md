# Mirror Configuration (镜像配置)

## Overview

simple-code uses a 5-segment mirror configuration system inspired by cargo's `.cargo/config.toml` precedence model. This ensures China-friendly defaults while allowing full customization.

## Configuration Structure

The mirror configuration is in `~/.simple-code/config.toml`:

```toml
[net]
# Global fallback mirror (cargo .cargo/config.toml [net] base)
mirror = "https://ghproxy.com/"

[net.release]                            # npm package downloads
github_release = "https://ghproxy.com/https://registry.npmjs.org/simple-code"
homebrew_bottle = "https://ghproxy.com/https://github.com/Homebrew/homebrew-core"
npm_package = "https://registry.npmmirror.com"

[net.llm]                                # LLM API endpoint
mirror = "https://api.openai-proxy.com/v1"

[net.lsp]                                # LSP server downloads
mirror = "https://gh-proxy.com/"

[net.browser]                            # chromium / playwright
mirror = "https://npmmirror.com/mirrors/playwright"

[net.mcp]                                # MCP server install
mirror = ""

[net.upstream]                           # maintainer fetch (not user)
git_clone = "https://ghproxy.com/https://github.com/"
github_release = "https://ghproxy.com/https://github.com/"
```

## Resolution Order

When resolving a mirror URL, simple-code follows this priority:

1. **Component field** (e.g., `net.release.github_release`)
2. **Component mirror** (e.g., `net.lsp.mirror`)
3. **Global net.mirror** (e.g., `[net] mirror`)
4. **Empty** (original URL, no mirror)

This means component-specific overrides take precedence over global defaults.

## Default China-Friendly Sources

The default configuration uses these mirrors for mainland China:

| Segment | Mirror | Purpose |
|---------|--------|---------|
| `net.release.github_release` | ghproxy.com | GitHub releases |
| `net.release.npm_package` | npmmirror.com | npm packages |
| `net.llm.mirror` | api.openai-proxy.com | LLM API proxy |
| `net.lsp.mirror` | gh-proxy.com | LSP server downloads |
| `net.browser.mirror` | npmmirror.com | Playwright/Chromium |
| `net.upstream.git_clone` | ghproxy.com | Git clone mirror |

## Customization Examples

### Use original sources (no mirror)

```toml
[net]
mirror = ""

[net.release]
github_release = ""
npm_package = ""
```

### Use custom proxy

```toml
[net]
mirror = "https://my-proxy.example.com/"

[net.llm]
mirror = "https://my-llm-proxy.example.com/v1"
```

### Disable specific mirrors

```toml
[net.lsp]
mirror = ""  # Download LSP servers directly
```

## CLI Commands

```bash
# Show current mirror configuration
simple-code config show

# List all mirror keys
simple-code config list

# Get specific mirror value
simple-code config get net.lsp.mirror

# Set a mirror
simple-code config set net.mirror "https://my-proxy.com/"

# Unset (revert to default)
simple-code config unset net.mirror
```

## Troubleshooting

### Mirror not working

1. Check the mirror URL is accessible: `curl -I <mirror-url>`
2. Verify the config: `simple-code config show`
3. Check if the segment is correctly overridden

### Reset to defaults

```bash
rm ~/.simple-code/config.toml
simple-code init
```

### Verify mirror resolution

The `MirrorResolver` class in `packages/config/src/mirror-resolver.ts` implements the cargo-style precedence. You can test resolution programmatically:

```typescript
import { MirrorResolver } from '@simple-code/config';
import { DEFAULT_CONFIG } from '@simple-code/config';

const resolver = new MirrorResolver(DEFAULT_CONFIG);
console.log(resolver.resolve('lsp', 'mirror')); // https://gh-proxy.com/
```
