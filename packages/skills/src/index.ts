// packages/skills/src/index.ts — Skills framework for simple-code plugin
// Provides registerCommand() and registerSkill() for UA + agent-skills integration

export interface CommandDef {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<void>;
}

export interface SkillDef {
  name: string;
  description: string;
  triggers: string[];
  handler: (context: unknown) => Promise<void>;
}

const commands = new Map<string, CommandDef>();
const skills = new Map<string, SkillDef>();

export function registerCommand(def: CommandDef): void {
  commands.set(def.name, def);
}

export function registerSkill(def: SkillDef): void {
  skills.set(def.name, def);
}

export function getCommand(name: string): CommandDef | undefined {
  return commands.get(name);
}

export function getSkill(name: string): SkillDef | undefined {
  return skills.get(name);
}

export function listCommands(): CommandDef[] {
  return Array.from(commands.values());
}

export function listSkills(): SkillDef[] {
  return Array.from(skills.values());
}
