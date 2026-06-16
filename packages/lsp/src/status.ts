// packages/lsp/src/status.ts — Real LSP status detection
import { spawnSync } from "node:child_process";

export interface LspStatus {
  name: string;
  language: string;
  installed: boolean;
  version?: string;
  path?: string;
  action?: string;
}

const LSP_COMMANDS: Record<string, { cmd: string; args: string[]; versionArg: string }> = {
  "rust-analyzer": { cmd: "rust-analyzer", args: [], versionArg: "--version" },
  "pyright": { cmd: "pyright", args: [], versionArg: "--version" },
  "typescript-language-server": { cmd: "typescript-language-server", args: [], versionArg: "--version" },
  "jdtls": { cmd: "jdtls", args: [], versionArg: "--version" },
  "gopls": { cmd: "gopls", args: [], versionArg: "version" },
  "clangd": { cmd: "clangd", args: [], versionArg: "--version" },
};

const LSP_LANGUAGES: Record<string, string> = {
  "rust-analyzer": "rust",
  "pyright": "python",
  "typescript-language-server": "typescript",
  "jdtls": "java",
  "gopls": "go",
  "clangd": "c_cpp",
};

export function checkLspStatus(name: string): LspStatus {
  const lang = LSP_LANGUAGES[name] ?? "unknown";
  const cmdInfo = LSP_COMMANDS[name];

  if (!cmdInfo) {
    return { name, language: lang, installed: false, action: `Unknown LSP: ${name}` };
  }

  const which = spawnSync("which", [cmdInfo.cmd], { encoding: "utf-8", timeout: 5000 });
  if (which.status !== 0) {
    return {
      name,
      language: lang,
      installed: false,
      action: `Install: ${getInstallHint(name)}`,
    };
  }

  const path = which.stdout.trim();
  const versionCmd = spawnSync(cmdInfo.cmd, [cmdInfo.versionArg], { encoding: "utf-8", timeout: 5000 });
  const version = versionCmd.stdout?.trim().split("\n")[0] ?? "unknown";

  return { name, language: lang, installed: true, version, path };
}

export function checkAllLsps(): LspStatus[] {
  return Object.keys(LSP_COMMANDS).map(name => checkLspStatus(name));
}

function getInstallHint(name: string): string {
  const hints: Record<string, string> = {
    "rust-analyzer": "rustup component add rust-analyzer",
    "pyright": "npm i -g pyright",
    "typescript-language-server": "npm i -g typescript typescript-language-server",
    "jdtls": "brew install jdtls (or download from eclipse.org)",
    "gopls": "go install golang.org/x/tools/gopls@latest",
    "clangd": "brew install llvm (or apt install clangd)",
  };
  return hints[name] ?? `Install ${name}`;
}
