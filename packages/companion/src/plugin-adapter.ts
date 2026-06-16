// T4.5 — plugin adapter: 28 opencode lifecycle events → POST to simple-coded :3111
// Loaded by src/index.ts plugin entry as thin wrapper

const DEFAULT_PORT = 3111;
const SIMPLE_CODE_CONFIG = `${process.env.HOME}/.simple-code/config.toml`;

let _port: number | null = null;
let _base: string | null = null;

function getPort(): number {
  if (_port !== null) return _port;
  // Lazy: read from config or env override
  const envPort = process.env.SIMPLE_CODE_MEMORY_PORT;
  if (envPort) {
    _port = parseInt(envPort, 10) || DEFAULT_PORT;
  } else {
    // TODO: read from ~/.simple-code/config.toml
    _port = DEFAULT_PORT;
  }
  _base = `http://localhost:${_port}`;
  return _port;
}

function getBase(): string {
  if (_base) return _base;
  getPort();
  return _base!;
}

// Fire-and-forget POST to simple-coded /memory/observe
async function observe(event: string, data: unknown): Promise<void> {
  const port = getPort();
  const base = `http://localhost:${port}`;
  try {
    await fetch(`${base}/memory/observe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    }).catch(() => {}); // silent fail if daemon not running
  } catch {
    // daemon not running — expected in plugin mode (daemon starts via `simple-code init`)
  }
}

// ─── 28 hook factory (T4.5) ───

export function makeHooks() {
  return {
    "command.executed": async (data: unknown) => { await observe("command.executed", data); },
    "file.edited": async (data: unknown) => { await observe("file.edited", data); },
    "file.watcher.updated": async (data: unknown) => { await observe("file.watcher.updated", data); },
    "installation.updated": async (data: unknown) => { await observe("installation.updated", data); },
    "lsp.client.diagnostics": async (data: unknown) => { await observe("lsp.client.diagnostics", data); },
    "lsp.updated": async (data: unknown) => { await observe("lsp.updated", data); },
    "message.part.removed": async (data: unknown) => { await observe("message.part.removed", data); },
    "message.part.updated": async (data: unknown) => { await observe("message.part.updated", data); },
    "message.removed": async (data: unknown) => { await observe("message.removed", data); },
    "message.updated": async (data: unknown) => { await observe("message.updated", data); },
    "permission.asked": async (data: unknown) => { await observe("permission.asked", data); },
    "permission.replied": async (data: unknown) => { await observe("permission.replied", data); },
    "server.connected": async (data: unknown) => { await observe("server.connected", data); },
    "session.created": async (data: unknown) => { await observe("session.created", data); },
    "session.compacted": async (data: unknown) => { await observe("session.compacted", data); },
    "session.deleted": async (data: unknown) => { await observe("session.deleted", data); },
    "session.diff": async (data: unknown) => { await observe("session.diff", data); },
    "session.error": async (data: unknown) => { await observe("session.error", data); },
    "session.idle": async (data: unknown) => { await observe("session.idle", data); },
    "session.status": async (data: unknown) => { await observe("session.status", data); },
    "session.updated": async (data: unknown) => { await observe("session.updated", data); },
    "todo.updated": async (data: unknown) => { await observe("todo.updated", data); },
    "shell.env": async (data: unknown) => { await observe("shell.env", data); },
    "tool.execute.after": async (data: unknown) => { await observe("tool.execute.after", data); },
    "tool.execute.before": async (data: unknown) => { await observe("tool.execute.before", data); },
    "tui.prompt.append": async (data: unknown) => { await observe("tui.prompt.append", data); },
    "tui.command.execute": async (data: unknown) => { await observe("tui.command.execute", data); },
    "tui.toast.show": async (data: unknown) => { await observe("tui.toast.show", data); },
  };
}
