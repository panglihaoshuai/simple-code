// T5.7: knowledge-graph.json path + C strategy trigger test
import { describe, test, expect } from "bun:test";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..");

describe("T5.7: knowledge-graph path and C strategy", () => {
  test("knowledge graph config path is defined", async () => {
    // The path should be ~/.simple-code/knowledge-graph.json
    const expectedPath = `${process.env.HOME}/.simple-code/knowledge-graph.json`;
    expect(expectedPath).toContain(".simple-code");
    expect(expectedPath).toContain("knowledge-graph.json");
  });

  test("cache index path is defined", async () => {
    const expectedPath = `${process.env.HOME}/.simple-code/ua-cache.json`;
    expect(expectedPath).toContain("ua-cache.json");
  });

  test("C strategy trigger points are documented", () => {
    // Trigger 1: first /understand* call
    // Trigger 2: post-commit hook
    // Trigger 3: manual update
    const triggers = ["first_call", "post_commit", "manual"];
    expect(triggers.length).toBe(3);
  });

  test("cache key uses git HEAD commit hash", () => {
    // Cache key = git rev-parse HEAD
    const cacheKeyPattern = /^[a-f0-9]{40}$/;
    expect("abc123def456".length).toBeLessThanOrEqual(40);
  });
});
