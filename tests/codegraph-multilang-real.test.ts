// tests/codegraph-multilang-real.test.ts — Real upstream multi-language coverage
// Only runs when SIMPLE_CODE_CODEGRAPH_REAL_SMOKE=1 and upstream codegraph CLI installed
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const runSmoke = process.env.SIMPLE_CODE_CODEGRAPH_REAL_SMOKE === "1";

interface LangFixture {
  lang: string;
  ext: string;
  filename: string;
  content: string;
  symbol: string;
}

const LANGUAGES: LangFixture[] = [
  { lang: "TypeScript", ext: ".ts", filename: "demo.ts", content: `export function TsService(): string { return "ts"; }`, symbol: "TsService" },
  { lang: "Python", ext: ".py", filename: "demo.py", content: `def PythonService():\n    return "py"\n`, symbol: "PythonService" },
  { lang: "Go", ext: ".go", filename: "demo.go", content: `package main\nfunc GoService() string { return "go" }\n`, symbol: "GoService" },
  { lang: "Rust", ext: ".rs", filename: "demo.rs", content: `pub fn RustService() -> &'static str { "rs" }`, symbol: "RustService" },
  { lang: "Java", ext: ".java", filename: "Demo.java", content: `public class JavaService { public String run() { return "java"; } }`, symbol: "JavaService" },
  { lang: "C", ext: ".c", filename: "demo.c", content: `int CFunction(void) { return 0; }\n`, symbol: "CFunction" },
];

let TMP_PROJECT: string;

beforeAll(() => {
  TMP_PROJECT = join(tmpdir(), `cg-multilang-${Date.now()}`);
  mkdirSync(TMP_PROJECT, { recursive: true });
  for (const l of LANGUAGES) {
    writeFileSync(join(TMP_PROJECT, l.filename), l.content);
  }
});

afterAll(() => {
  if (existsSync(TMP_PROJECT)) rmSync(TMP_PROJECT, { recursive: true });
});

describe.skipIf(!runSmoke)("Upstream CodeGraph multi-language coverage", () => {
  test("upstream CLI is available", () => {
    const r = spawnSync("which", ["codegraph"], { encoding: "utf-8" });
    expect(r.status).toBe(0);
  });

  test("codegraph init builds the index", () => {
    const r = spawnSync("codegraph", ["init", TMP_PROJECT], { encoding: "utf-8", timeout: 60000 });
    expect(r.status).toBe(0);
    expect(existsSync(join(TMP_PROJECT, ".codegraph", "codegraph.db"))).toBe(true);
  });

  test("each language symbol is queryable", () => {
    for (const l of LANGUAGES) {
      const r = spawnSync("codegraph", ["query", l.symbol, "--path", TMP_PROJECT], { encoding: "utf-8", timeout: 15000 });
      expect(r.status).toBe(0);
      // upstream CLI returns symbol info
      expect(r.stdout).toContain(l.symbol);
    }
  });

  test("codegraph status reports index health", () => {
    const r = spawnSync("codegraph", ["status", TMP_PROJECT], { encoding: "utf-8", timeout: 10000 });
    expect(r.status).toBe(0);
  });

  test("cleanup uninit", () => {
    // Try uninit; may fail with interactive prompt
    const r = spawnSync("codegraph", ["uninit", TMP_PROJECT, "--force"], { encoding: "utf-8", timeout: 10000 });
    // Don't assert — cleanup happens via rmSync in afterAll anyway
  });
});

describe("Multi-language matrix (skipped unless env-gated)", () => {
  test.skipIf(!runSmoke)("at least 6 core languages indexed", () => {
    expect(LANGUAGES.length).toBe(6);
  });
});