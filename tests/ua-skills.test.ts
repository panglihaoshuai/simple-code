// T5.4 + T5.5: UA commands + agent-skills integration test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";

const REPO = join(import.meta.dir, "..");

describe("T5.4: UA /understand commands", () => {
  test("UA skill files exist in vendored directory", () => {
    const skillsIndex = join(REPO, "packages", "skills", "src", "index.ts");
    expect(existsSync(skillsIndex)).toBe(true);
  });

  test("skills framework can register UA commands", async () => {
    const { registerCommand, listCommands } = await import(join(REPO, "packages", "skills", "src", "index.ts"));
    
    registerCommand({
      name: "/understand",
      description: "Analyze codebase and generate knowledge graph",
      handler: async () => {},
    });
    
    const cmds = listCommands();
    expect(cmds.length).toBeGreaterThanOrEqual(1);
    expect(cmds.some((c: { name: string }) => c.name === "/understand")).toBe(true);
  });
});

describe("T5.5: agent-skills integration", () => {
  test("agent-skills directory planned in vendored", () => {
    const skillsDir = join(REPO, "packages", "skills");
    expect(existsSync(skillsDir)).toBe(true);
  });

  test("skills framework can register agent skills", async () => {
    const { registerSkill, listSkills } = await import(join(REPO, "packages", "skills", "src", "index.ts"));
    
    registerSkill({
      name: "test-driven-development",
      description: "TDD workflow enforcement",
      triggers: ["new feature", "add function"],
      handler: async () => {},
    });
    
    const skills = listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(1);
    expect(skills.some((s: { name: string }) => s.name === "test-driven-development")).toBe(true);
  });
});
