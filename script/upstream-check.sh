#!/bin/bash
# upstream-check.sh - Check upstream dependencies for simple-code plugin
# T3.1: Main framework for upstream checking

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SIMPLE_CODE_CONFIG:-$HOME/.simple-code/config.toml}"
OUTPUT_FILE="${UPSTREAM_STATUS_OUTPUT:-$HOME/.simple-code/upstream-status.json}"

# Help message
show_help() {
    cat << EOF
upstream-check.sh - Check upstream dependencies for simple-code plugin

Usage: upstream-check.sh [OPTIONS]

Options:
    --help              Show this help message
    --check COMPONENT   Check specific component (agentmemory|ua|agent-skills|all)
    --output FILE       Output JSON file path (default: ~/.simple-code/upstream-status.json)

Components:
    agentmemory         Check agentmemory upstream
    ua                  Check Understand-Anything upstream
    agent-skills        Check agent-skills upstream
    all                 Check all components (default)

Examples:
    upstream-check.sh
    upstream-check.sh --check agentmemory
    upstream-check.sh --output /tmp/status.json
EOF
}

# Parse arguments
CHECK_COMPONENT="all"
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --check)
            CHECK_COMPONENT="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            show_help
            exit 1
            ;;
    esac
done

# Initialize output
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMPONENTS="{}"

# Check agentmemory
check_agentmemory() {
    # Get current installed version from package.json if exists
    local current="unknown"
    if [ -f "$SCRIPT_DIR/../node_modules/@agentmemory/agentmemory/package.json" ]; then
        current=$(grep '"version"' "$SCRIPT_DIR/../node_modules/@agentmemory/agentmemory/package.json" | head -1 | sed 's/.*: "//;s/".*//')
    fi
    
    # Try to get latest from npm (simplified - in real implementation would use npm view)
    local latest="unknown"
    local delta="unknown"
    local must_release="false"
    
    echo "{\"current\": \"$current\", \"latest\": \"$latest\", \"delta\": \"$delta\", \"must_release\": $must_release}"
}

# Check Understand-Anything
check_ua() {
    local current="unknown"
    if [ -f "$SCRIPT_DIR/../vendored/skills/understand-anything/package.json" ]; then
        current=$(grep '"version"' "$SCRIPT_DIR/../vendored/skills/understand-anything/package.json" | head -1 | sed 's/.*: "//;s/".*//')
    fi
    
    local latest="unknown"
    local delta="unknown"
    local must_release="false"
    
    echo "{\"current\": \"$current\", \"latest\": \"$latest\", \"delta\": \"$delta\", \"must_release\": $must_release}"
}

# Check agent-skills
check_agent_skills() {
    local current="unknown"
    if [ -f "$SCRIPT_DIR/../vendored/skills/agent-skills/package.json" ]; then
        current=$(grep '"version"' "$SCRIPT_DIR/../vendored/skills/agent-skills/package.json" | head -1 | sed 's/.*: "//;s/".*//')
    fi
    
    local latest="unknown"
    local delta="unknown"
    local must_release="false"
    
    echo "{\"current\": \"$current\", \"latest\": \"$latest\", \"delta\": \"$delta\", \"must_release\": $must_release}"
}

# Check LSP servers
check_lsp() {
    local lsp_servers=("rust-analyzer" "pyright" "typescript-language-server" "jdtls" "gopls" "clangd")
    local result="{"
    
    for lsp in "${lsp_servers[@]}"; do
        local current="unknown"
        local latest="unknown"
        local delta="unknown"
        local must_release="false"
        
        # Check if LSP is installed locally
        if [ -d "$HOME/.simple-code/lsp/$lsp" ]; then
            # Try to get version from binary
            case $lsp in
                rust-analyzer)
                    if [ -f "$HOME/.simple-code/lsp/$lsp/rust-analyzer" ]; then
                        current=$("$HOME/.simple-code/lsp/$lsp/rust-analyzer" --version 2>/dev/null | head -1 | awk '{print $2}' || echo "unknown")
                    fi
                    ;;
                pyright)
                    if [ -f "$HOME/.simple-code/lsp/$lsp/node_modules/.bin/pyright" ]; then
                        current=$("$HOME/.simple-code/lsp/$lsp/node_modules/.bin/pyright" --version 2>/dev/null || echo "unknown")
                    fi
                    ;;
                typescript-language-server)
                    if [ -f "$HOME/.simple-code/lsp/$lsp/node_modules/.bin/typescript-language-server" ]; then
                        current=$("$HOME/.simple-code/lsp/$lsp/node_modules/.bin/typescript-language-server" --version 2>/dev/null || echo "unknown")
                    fi
                    ;;
                jdtls)
                    if [ -f "$HOME/.simple-code/lsp/$lsp/bin/jdtls" ]; then
                        current="installed"
                    fi
                    ;;
                gopls)
                    if [ -f "$HOME/.simple-code/lsp/$lsp/gopls" ]; then
                        current=$("$HOME/.simple-code/lsp/$lsp/gopls" version 2>/dev/null | head -1 || echo "unknown")
                    fi
                    ;;
                clangd)
                    if [ -f "$HOME/.simple-code/lsp/$lsp/bin/clangd" ]; then
                        current=$("$HOME/.simple-code/lsp/$lsp/bin/clangd" --version 2>/dev/null | head -1 | awk '{print $3}' || echo "unknown")
                    fi
                    ;;
            esac
        fi
        
        result="$result\"$lsp\": {\"current\": \"$current\", \"latest\": \"$latest\", \"delta\": \"$delta\", \"must_release\": $must_release},"
    done
    
    # Remove trailing comma and close
    result="${result%,}}"
    echo "$result"
}

# Check playwright + chromium
check_playwright() {
    local current="unknown"
    local latest="unknown"
    local delta="unknown"
    local must_release="false"
    local binary_size_delta_pct="5"
    
    # Check if playwright is installed
    if [ -d "$HOME/.simple-code/browser/playwright" ]; then
        # Try to get version from package.json
        if [ -f "$HOME/.simple-code/browser/playwright/package.json" ]; then
            current=$(grep '"version"' "$HOME/.simple-code/browser/playwright/package.json" | head -1 | sed 's/.*: "//;s/".*//')
        fi
    fi
    
    echo "{\"current\": \"$current\", \"latest\": \"$latest\", \"delta\": \"$delta\", \"must_release\": $must_release, \"binary_size_delta_pct\": $binary_size_delta_pct}"
}

# Build components JSON
build_components() {
    local components="{"
    
    if [ "$CHECK_COMPONENT" = "all" ] || [ "$CHECK_COMPONENT" = "agentmemory" ]; then
        components="$components\"agentmemory\": $(check_agentmemory),"
    fi
    
    if [ "$CHECK_COMPONENT" = "all" ] || [ "$CHECK_COMPONENT" = "ua" ]; then
        components="$components\"understand_anything\": $(check_ua),"
    fi
    
    if [ "$CHECK_COMPONENT" = "all" ] || [ "$CHECK_COMPONENT" = "agent-skills" ]; then
        components="$components\"agent_skills\": $(check_agent_skills),"
    fi
    
    if [ "$CHECK_COMPONENT" = "all" ] || [ "$CHECK_COMPONENT" = "lsp" ]; then
        components="$components\"lsp\": $(check_lsp),"
    fi
    
    if [ "$CHECK_COMPONENT" = "all" ] || [ "$CHECK_COMPONENT" = "playwright" ]; then
        components="$components\"playwright\": $(check_playwright),"
    fi
    
    # Remove trailing comma and close
    components="${components%,}}"
    echo "$components"
}

# Build full output JSON
build_output() {
    local components=$(build_components)
    
    cat << EOF
{
  "checked_at": "$TIMESTAMP",
  "triggers_fired": [],
  "components": $components,
  "last_release_at": null,
  "stale_days": 0,
  "recommendation": "UNKNOWN",
  "recommendation_reason": "Manual check - no automated comparison"
}
EOF
}

# Write output
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"
build_output > "$OUTPUT_FILE"

echo "Upstream check completed. Output: $OUTPUT_FILE"
