// tests/codegraph-real.test.ts — Real CodeGraph symbol extraction tests
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const REPO = join(import.meta.dir, "..");

describe("CodeGraph real symbol extraction", () => {
  test("analyze extracts function declarations", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));

    const source = `
export function add(a: number, b: number): number {
  return a + b;
}

export async function fetchData(url: string): Promise<unknown> {
  return fetch(url);
}
`;

    const result = analyze(source, "test.ts");
    expect(result.symbols.length).toBeGreaterThanOrEqual(2);
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "add" && s.kind === "function")).toBe(true);
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "fetchData" && s.kind === "function")).toBe(true);
  });

  test("analyze extracts class declarations", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));

    const source = `
export class TodoStore {
  private items: string[] = [];
  add(item: string) { this.items.push(item); }
}

export abstract class BaseProvider {
  abstract connect(): Promise<void>;
}
`;

    const result = analyze(source, "test.ts");
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "TodoStore" && s.kind === "class")).toBe(true);
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "BaseProvider" && s.kind === "class")).toBe(true);
  });

  test("analyze extracts interface and type declarations", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));

    const source = `
export interface Config {
  port: number;
  host: string;
}

export type Status = "ok" | "error";
`;

    const result = analyze(source, "test.ts");
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "Config" && s.kind === "interface")).toBe(true);
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "Status" && s.kind === "type")).toBe(true);
  });

  test("analyze extracts const declarations", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));

    const source = `
export const DEFAULT_PORT = 3111;
export const API_BASE = "http://localhost";
`;

    const result = analyze(source, "test.ts");
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "DEFAULT_PORT" && s.kind === "variable")).toBe(true);
    expect(result.symbols.some((s: { name: string; kind: string }) => s.name === "API_BASE" && s.kind === "variable")).toBe(true);
  });

  test("analyze returns correct file and line count", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));

    const source = `line 1\nline 2\nline 3`;
    const result = analyze(source, "test.ts");
    expect(result.file).toBe("test.ts");
    expect(result.lines).toBe(3);
  });

  test("analyze returns line numbers starting from 1", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));

    const source = `export function first() {}\nexport function second() {}`;
    const result = analyze(source, "test.ts");
    expect(result.symbols[0].line).toBe(1);
    expect(result.symbols[1].line).toBe(2);
  });

  test("analyze on real project file finds symbols", async () => {
    const { analyze } = await import(join(REPO, "packages", "codegraph", "src", "index.ts"));
    const { readFileSync } = await import("node:fs");

    // Analyze a real file from the project
    const source = readFileSync(join(REPO, "packages", "agentmemory", "src", "types.ts"), "utf-8");
    const result = analyze(source, "packages/agentmemory/src/types.ts");

    expect(result.symbols.length).toBeGreaterThanOrEqual(1);
    expect(result.lines).toBeGreaterThan(0);
  });
});
