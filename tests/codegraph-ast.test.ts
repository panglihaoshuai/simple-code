// tests/codegraph-ast.test.ts — AST-backed CodeGraph tests
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const REPO = join(import.meta.dir, "..");
let FIXTURE_DIR: string;

beforeAll(() => {
  FIXTURE_DIR = join(tmpdir(), `codegraph-ast-test-${Date.now()}`);
  mkdirSync(FIXTURE_DIR, { recursive: true });

  writeFileSync(join(FIXTURE_DIR, "math.ts"), `export function add(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14;
`);

  writeFileSync(join(FIXTURE_DIR, "store.ts"), `import { add } from "./math";

export interface Task {
  id: string;
  done: boolean;
}

export type TaskId = string;

export class TodoStore {
  private tasks: Task[] = [];

  addTask(task: Task): number {
    this.tasks.push(task);
    return add(this.tasks.length, 0);
  }
}
`);

  writeFileSync(join(FIXTURE_DIR, "index.ts"), `export { TodoStore } from "./store";
`);
});

afterAll(() => {
  if (existsSync(FIXTURE_DIR)) rmSync(FIXTURE_DIR, { recursive: true });
});

describe("CodeGraph AST extraction", () => {
  test("analyzeProject returns file count === 3", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    expect(result.files.length).toBe(3);
  });

  test("identifies function add", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const add = result.symbols.find((s: { name: string; kind: string }) => s.name === "add" && s.kind === "function");
    expect(add).toBeDefined();
    expect(add!.file).toContain("math.ts");
    expect(add!.line).toBeGreaterThan(0);
  });

  test("identifies const PI", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const pi = result.symbols.find((s: { name: string; kind: string }) => s.name === "PI" && s.kind === "variable");
    expect(pi).toBeDefined();
  });

  test("identifies interface Task", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const task = result.symbols.find((s: { name: string; kind: string }) => s.name === "Task" && s.kind === "interface");
    expect(task).toBeDefined();
    expect(task!.file).toContain("store.ts");
  });

  test("identifies type alias TaskId", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const taskId = result.symbols.find((s: { name: string; kind: string }) => s.name === "TaskId" && s.kind === "type");
    expect(taskId).toBeDefined();
  });

  test("identifies class TodoStore", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const store = result.symbols.find((s: { name: string; kind: string }) => s.name === "TodoStore" && s.kind === "class");
    expect(store).toBeDefined();
  });

  test("identifies method addTask", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const addTask = result.symbols.find((s: { name: string; kind: string }) => s.name === "addTask" && s.kind === "method");
    expect(addTask).toBeDefined();
    expect(addTask!.parent).toBe("TodoStore");
  });

  test("identifies import add from ./math", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const imp = result.imports.find((i: { sourceFile: string; names: string[] }) => i.sourceFile.includes("store.ts") && i.names.includes("add"));
    expect(imp).toBeDefined();
    expect(imp!.importedFrom).toContain("math");
  });

  test("identifies re-export TodoStore", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const exp = result.exports.find((e: { sourceFile: string; names: string[] }) => e.sourceFile.includes("index.ts") && e.names.includes("TodoStore"));
    expect(exp).toBeDefined();
  });

  test("symbol locations include file and line", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    for (const sym of result.symbols) {
      expect(sym.file).toBeDefined();
      expect(sym.line).toBeGreaterThan(0);
      expect(sym.column).toBeGreaterThanOrEqual(0);
    }
  });

  test("no duplicate symbol records", async () => {
    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(FIXTURE_DIR);
    const keys = result.symbols.map((s: { name: string; kind: string; file: string; line: number }) => `${s.kind}:${s.name}:${s.file}:${s.line}`);
    const unique = new Set(keys);
    expect(keys.length).toBe(unique.size);
  });

  test("malformed file does not crash entire scan", async () => {
    const badDir = join(tmpdir(), `codegraph-bad-${Date.now()}`);
    mkdirSync(badDir, { recursive: true });
    writeFileSync(join(badDir, "good.ts"), "export function ok() {}");
    writeFileSync(join(badDir, "bad.ts"), "export function { this is not valid typescript {{{{{");

    const { analyzeProject } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyzeProject(badDir);
    expect(result.files.length).toBe(2);
    // good.ts should still produce symbols even if bad.ts is malformed
    const goodSymbols = result.symbols.filter((s: { file: string }) => s.file.includes("good.ts"));
    expect(goodSymbols.length).toBeGreaterThanOrEqual(1);

    rmSync(badDir, { recursive: true });
  });

  test("old analyze() still works for backward compat", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const result = analyze("export function hello() {}", "test.ts");
    expect(result.symbols.length).toBeGreaterThanOrEqual(1);
    expect(result.symbols[0].name).toBe("hello");
  });
});
