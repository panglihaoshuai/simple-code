// packages/lsp/src/index.ts — LSP abstraction layer
// Provides install/remove/list for 5 LSP servers

export interface LspServer {
  name: string;
  language: string;
  installCmd: string;
  binaryPath: string;
}

const SUPPORTED_LSPS: LspServer[] = [
  { name: "rust-analyzer", language: "rust", installCmd: "rustup component add rust-analyzer", binaryPath: "rust-analyzer" },
  { name: "pyright", language: "python", installCmd: "npm install -g pyright", binaryPath: "pyright" },
  { name: "typescript-language-server", language: "typescript", installCmd: "npm install -g typescript-language-server", binaryPath: "typescript-language-server" },
  { name: "jdtls", language: "java", installCmd: "brew install jdtls", binaryPath: "jdtls" },
  { name: "gopls", language: "go", installCmd: "go install golang.org/x/tools/gopls@latest", binaryPath: "gopls" },
  { name: "clangd", language: "c_cpp", installCmd: "brew install llvm", binaryPath: "clangd" },
];

export function listLsps(): LspServer[] {
  return SUPPORTED_LSPS;
}

export async function installLsp(name: string): Promise<{ success: boolean; message: string }> {
  const lsp = SUPPORTED_LSPS.find(l => l.name === name);
  if (!lsp) {
    return { success: false, message: `Unknown LSP: ${name}` };
  }
  // Stub: real implementation will download and install
  return { success: true, message: `${name} install stub — real download pending` };
}

export async function removeLsp(name: string): Promise<{ success: boolean; message: string }> {
  const lsp = SUPPORTED_LSPS.find(l => l.name === name);
  if (!lsp) {
    return { success: false, message: `Unknown LSP: ${name}` };
  }
  // Stub: real implementation will remove binary
  return { success: true, message: `${name} remove stub` };
}
