// T4.4: launchd/systemd/WinSW service management test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `simple-code-service-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
});

describe("T4.4: service management", () => {
  test("service template files exist", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    // This test will fail until we create the service templates
    expect(existsSync(serviceDir)).toBe(true);
  });

  test("launchd plist template exists", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    const plistPath = join(serviceDir, "com.simple-code.daemon.plist");
    expect(existsSync(plistPath)).toBe(true);
  });

  test("systemd unit template exists", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    const unitPath = join(serviceDir, "simple-code.service");
    expect(existsSync(unitPath)).toBe(true);
  });

  test("WinSW XML template exists", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    const xmlPath = join(serviceDir, "simple-code.xml");
    expect(existsSync(xmlPath)).toBe(true);
  });

  test("launchd plist has correct structure", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    const plistPath = join(serviceDir, "com.simple-code.daemon.plist");
    
    if (existsSync(plistPath)) {
      const content = readFileSync(plistPath, "utf-8");
      expect(content).toContain("Label");
      expect(content).toContain("ProgramArguments");
      expect(content).toContain("RunAtLoad");
    }
  });

  test("systemd unit has correct structure", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    const unitPath = join(serviceDir, "simple-code.service");
    
    if (existsSync(unitPath)) {
      const content = readFileSync(unitPath, "utf-8");
      expect(content).toContain("[Unit]");
      expect(content).toContain("[Service]");
      expect(content).toContain("[Install]");
    }
  });

  test("WinSW XML has correct structure", () => {
    const serviceDir = join(process.cwd(), "packages", "companion", "service");
    const xmlPath = join(serviceDir, "simple-code.xml");
    
    if (existsSync(xmlPath)) {
      const content = readFileSync(xmlPath, "utf-8");
      expect(content).toContain("<service>");
      expect(content).toContain("<id>");
      expect(content).toContain("<name>");
    }
  });
});
