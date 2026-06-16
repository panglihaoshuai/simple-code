// T5.3: packages/skills/ framework test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-skills-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

describe("T5.3: skills framework", () => {
  test("packages/skills directory exists", () => {
    const skillsDir = join(process.cwd(), "packages", "skills");
    expect(existsSync(skillsDir)).toBe(true);
  });

  test("packages/skills has index.ts", () => {
    const indexPath = join(process.cwd(), "packages", "skills", "src", "index.ts");
    expect(existsSync(indexPath)).toBe(true);
  });

  test("packages/skills has command directory", () => {
    const cmdDir = join(process.cwd(), "packages", "skills", "src", "command");
    expect(existsSync(cmdDir)).toBe(true);
  });

  test("packages/skills has skill directory", () => {
    const skillDir = join(process.cwd(), "packages", "skills", "src", "skill");
    expect(existsSync(skillDir)).toBe(true);
  });

  test("skills framework exports registerCommand function", () => {
    const indexPath = join(process.cwd(), "packages", "skills", "src", "index.ts");
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, "utf-8");
      expect(content).toContain("registerCommand");
    }
  });

  test("skills framework exports registerSkill function", () => {
    const indexPath = join(process.cwd(), "packages", "skills", "src", "index.ts");
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, "utf-8");
      expect(content).toContain("registerSkill");
    }
  });
});
