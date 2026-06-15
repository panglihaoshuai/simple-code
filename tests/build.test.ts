import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");
const DIST = join(REPO, "dist", "index.js");
const PKG = JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8"));

describe("simple-code package build", () => {
  test("package.json name must be 'simple-code'", () => {
    expect(PKG.name).toBe("simple-code");
  });

  test("package.json bin must expose 'simple-code' command", () => {
    expect(PKG.bin).toBeDefined();
    expect(PKG.bin["simple-code"]).toBe("./dist/index.js");
  });

  test("package.json must depend on @opencode-ai/plugin", () => {
    expect(PKG.dependencies?.["@opencode-ai/plugin"]).toMatch(/\^1\.17/);
  });

  test("dist/index.js must exist after build", () => {
    expect(existsSync(DIST)).toBe(true);
  });
});
