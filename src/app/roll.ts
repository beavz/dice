import { Scenario, DICE, type Die } from "@/lib/dice";
import { getCombiner, listCombiners, type Combiner } from "@/lib/outcome";

type CustomScenarioArgs = Parameters<typeof Scenario.custom>[0];

export type CombineAction = Combiner;
export const COMBINE_ACTION_OPTIONS = listCombiners();

export const MAX_COUNT_PER_DIE = 20;
export const MIN_MODIFIER = -20;
export const MAX_MODIFIER = 20;
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 30;

export type DieCounts = Record<Die, number>;

export type RegularRoll = {
  id: string;
  kind: "regular";
  name: string;
  counts: DieCounts;
  modifier: number;
};

export type CheckRoll = {
  id: string;
  kind: "check";
  name: string;
  difficulty: number;
  modifier: number;
  nat1s: boolean;
  advantage: boolean;
  disadvantage: boolean;
};

export type DaggerheartCheckRoll = {
  id: string;
  kind: "dhCheck";
  name: string;
  difficulty: number;
  modifier: number;
  advantage: boolean;
  disadvantage: boolean;
};

export type AttackRoll = {
  id: string;
  kind: "attack";
  name: string;
  armor: number;
  modifier: number;
  damageCounts: DieCounts;
  damageModifier: number;
  nat1s: boolean;
  advantage: boolean;
  disadvantage: boolean;
};

export type SpellSaveRoll = {
  id: string;
  kind: "spellSave";
  name: string;
  dc: number;
  saveModifier: number;
  damageCounts: DieCounts;
  damageModifier: number;
  saveTakesHalf: boolean;
  nat1s: boolean;
  advantage: boolean;
  disadvantage: boolean;
};

export type TossLowestRoll = {
  id: string;
  kind: "tossLowest";
  name: string;
  counts: DieCounts;
  modifier: number;
};

export type ModifyStep = { id: string; type: "modify"; amount: number };
export type EvaluateStep = { id: string; type: "evaluate"; difficulty: number };

// the shape shared by the top-level custom roll, every "and" step, and every
// "then" branch: an initial roll plus a list of further steps.
export type RollBlock = {
  counts: DieCounts;
  combine: CombineAction;
  criticalSuccess?: number;
  criticalFailure?: number;
  with?: "hope" | "fear";
  steps: CustomStep[];
};

export type AndStep = RollBlock & {
  id: string;
  type: "and";
  action: CombineAction;
};

export type ThenBranchKind =
  | "success"
  | "failure"
  | "criticalSuccess"
  | "criticalFailure";

export type ThenBranch = RollBlock & { action: CombineAction };

export type ThenStep = {
  id: string;
  type: "then";
  branches: Partial<Record<ThenBranchKind, ThenBranch>>;
};

export type CustomStep = ModifyStep | EvaluateStep | AndStep | ThenStep;

export type CustomRoll = {
  id: string;
  kind: "custom";
  name: string;
} & RollBlock;

export type Roll =
  | RegularRoll
  | CheckRoll
  | DaggerheartCheckRoll
  | AttackRoll
  | SpellSaveRoll
  | TossLowestRoll
  | CustomRoll;

export const INITIAL_COUNTS: DieCounts = {
  4: 0,
  6: 2,
  8: 0,
  10: 0,
  12: 0,
  20: 0,
  100: 0,
};

export const EMPTY_COUNTS: DieCounts = {
  4: 0,
  6: 0,
  8: 0,
  10: 0,
  12: 0,
  20: 0,
  100: 0,
};

export function createRegularRoll(
  counts: DieCounts = INITIAL_COUNTS,
): RegularRoll {
  return {
    id: crypto.randomUUID(),
    kind: "regular",
    name: "",
    counts: { ...counts },
    modifier: 0,
  };
}

export function createCheckRoll(): CheckRoll {
  return {
    id: crypto.randomUUID(),
    kind: "check",
    name: "",
    difficulty: 15,
    modifier: 0,
    nat1s: false,
    advantage: false,
    disadvantage: false,
  };
}

export function createDaggerheartCheckRoll(): DaggerheartCheckRoll {
  return {
    id: crypto.randomUUID(),
    kind: "dhCheck",
    name: "",
    difficulty: 15,
    modifier: 0,
    advantage: false,
    disadvantage: false,
  };
}

export function createAttackRoll(): AttackRoll {
  return {
    id: crypto.randomUUID(),
    kind: "attack",
    name: "",
    armor: 15,
    modifier: 0,
    damageCounts: { ...EMPTY_COUNTS, 6: 1 },
    damageModifier: 0,
    nat1s: false,
    advantage: false,
    disadvantage: false,
  };
}

export function createSpellSaveRoll(): SpellSaveRoll {
  return {
    id: crypto.randomUUID(),
    kind: "spellSave",
    name: "",
    dc: 15,
    saveModifier: 0,
    damageCounts: { ...EMPTY_COUNTS, 6: 3 },
    damageModifier: 0,
    saveTakesHalf: true,
    nat1s: false,
    advantage: false,
    disadvantage: false,
  };
}

export function createTossLowestRoll(): TossLowestRoll {
  return {
    id: crypto.randomUUID(),
    kind: "tossLowest",
    name: "",
    counts: { ...EMPTY_COUNTS, 6: 4 },
    modifier: 0,
  };
}

export function createRollBlock(): RollBlock {
  return {
    counts: { ...EMPTY_COUNTS, 20: 1 },
    combine: "sum",
    steps: [],
  };
}

export function createThenBranch(): ThenBranch {
  return {
    ...createRollBlock(),
    counts: { ...EMPTY_COUNTS, 6: 1 },
    action: "sum",
  };
}

export function createAndStep(): AndStep {
  return {
    id: crypto.randomUUID(),
    type: "and",
    ...createThenBranch(),
  };
}

export function createCustomRoll(): CustomRoll {
  return {
    id: crypto.randomUUID(),
    kind: "custom",
    name: "",
    ...createRollBlock(),
  };
}

export function createRoll(counts?: DieCounts): Roll {
  return createRegularRoll(counts);
}

export function withKind(roll: Roll, kind: Roll["kind"]): Roll {
  if (roll.kind === kind) return roll;
  const { id, name } = roll;
  switch (kind) {
    case "regular":
      return { ...createRegularRoll(EMPTY_COUNTS), id, name };
    case "check":
      return { ...createCheckRoll(), id, name };
    case "dhCheck":
      return { ...createDaggerheartCheckRoll(), id, name };
    case "attack":
      return { ...createAttackRoll(), id, name };
    case "spellSave":
      return { ...createSpellSaveRoll(), id, name };
    case "tossLowest":
      return { ...createTossLowestRoll(), id, name };
    case "custom":
      return { ...createCustomRoll(), id, name };
  }
}

export function formatExpression(counts: DieCounts, modifier: number): string {
  const terms = DICE.filter((sides) => counts[sides] > 0).map(
    (sides) => `${counts[sides]}d${sides}`,
  );
  if (terms.length === 0) return "";

  const expression = terms.join(" + ");
  if (modifier === 0) return expression;

  const sign = modifier > 0 ? "+" : "-";
  return `${expression} ${sign} ${Math.abs(modifier)}`;
}

export function formatCheckExpression(roll: CheckRoll): string {
  const parts = [`DC ${roll.difficulty} check`];
  if (roll.modifier !== 0) {
    const sign = roll.modifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(roll.modifier)}`);
  }

  const tags: string[] = [];
  if (roll.advantage) tags.push("advantage");
  if (roll.disadvantage) tags.push("disadvantage");
  if (roll.nat1s) tags.push("nat 1 crit-fails");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

export function formatDaggerheartExpression(
  roll: DaggerheartCheckRoll,
): string {
  const parts = [`DC ${roll.difficulty} Daggerheart check`];
  if (roll.modifier !== 0) {
    const sign = roll.modifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(roll.modifier)}`);
  }

  const tags: string[] = [];
  if (roll.advantage) tags.push("advantage");
  if (roll.disadvantage) tags.push("disadvantage");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

export function formatAttackExpression(roll: AttackRoll): string {
  const parts = [`AC ${roll.armor} attack`];
  if (roll.modifier !== 0) {
    const sign = roll.modifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(roll.modifier)}`);
  }

  const damage = formatExpression(roll.damageCounts, roll.damageModifier);
  if (damage) parts.push(`→ ${damage} damage`);

  const tags: string[] = [];
  if (roll.advantage) tags.push("advantage");
  if (roll.disadvantage) tags.push("disadvantage");
  if (roll.nat1s) tags.push("nat 1 crit-fails");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

export function formatSpellSaveExpression(roll: SpellSaveRoll): string {
  const parts = [`DC ${roll.dc} save`];
  if (roll.saveModifier !== 0) {
    const sign = roll.saveModifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(roll.saveModifier)}`);
  }

  const damage = formatExpression(roll.damageCounts, roll.damageModifier);
  if (damage) {
    parts.push(`→ ${damage} damage${roll.saveTakesHalf ? " (half on save)" : ""}`);
  }

  const tags: string[] = [];
  if (roll.advantage) tags.push("advantage");
  if (roll.disadvantage) tags.push("disadvantage");
  if (roll.nat1s) tags.push("nat 1 crit-fails");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

export function formatTossLowestExpression(roll: TossLowestRoll): string {
  const expression = formatExpression(roll.counts, roll.modifier);
  return expression ? `${expression}, drop lowest` : "";
}

const THEN_BRANCH_LABEL: Record<ThenBranchKind, string> = {
  success: "success",
  failure: "failure",
  criticalSuccess: "critical success",
  criticalFailure: "critical failure",
};

export function formatRollBlock(block: RollBlock): string {
  const base = formatExpression(block.counts, 0);
  if (!base) return "";

  const diceCount = DICE.reduce(
    (total, sides) => total + block.counts[sides],
    0,
  );
  const rollPart =
    diceCount > 1 && block.combine !== "sum"
      ? `${base} (${getCombiner(block.combine).label.toLowerCase()})`
      : base;

  const parts = [rollPart];
  for (const step of block.steps) {
    if (step.type === "modify") {
      parts.push(`${step.amount >= 0 ? "+" : "-"} ${Math.abs(step.amount)}`);
    } else if (step.type === "evaluate") {
      parts.push(`vs DC ${step.difficulty}`);
    } else if (step.type === "and") {
      const dice = formatExpression(step.counts, 0);
      if (dice)
        parts.push(
          `and ${dice} (${getCombiner(step.action).label.toLowerCase()})`,
        );
    } else {
      const activeBranches = (
        Object.keys(step.branches) as ThenBranchKind[]
      ).filter((kind) => step.branches[kind]);
      if (activeBranches.length > 0) {
        parts.push(
          `then on ${activeBranches.map((kind) => THEN_BRANCH_LABEL[kind]).join("/")}`,
        );
      }
    }
  }

  const tags: string[] = [];
  if (block.criticalSuccess !== undefined) {
    tags.push(`crit success on ${block.criticalSuccess}`);
  }
  if (block.criticalFailure !== undefined) {
    tags.push(`crit failure on ${block.criticalFailure}`);
  }
  if (block.with) tags.push(`with ${block.with}`);
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

export function formatCustomExpression(roll: CustomRoll): string {
  return formatRollBlock(roll);
}

export function getRollDisplayName(roll: Roll, index: number): string {
  return roll.name.trim() || `Roll ${index + 1}`;
}

export function formatRollLabel(roll: Roll): string {
  switch (roll.kind) {
    case "regular":
      return formatExpression(roll.counts, roll.modifier);
    case "check":
      return formatCheckExpression(roll);
    case "dhCheck":
      return formatDaggerheartExpression(roll);
    case "attack":
      return formatAttackExpression(roll);
    case "spellSave":
      return formatSpellSaveExpression(roll);
    case "tossLowest":
      return formatTossLowestExpression(roll);
    case "custom":
      return formatCustomExpression(roll);
  }
}

export function getDice(counts: DieCounts): Die[] {
  return DICE.flatMap((sides) => Array(counts[sides]).fill(sides));
}

export type DistributionPoint = { value: number; label: string; p: number };

function buildRollBlockArgs(block: RollBlock): CustomScenarioArgs {
  const rollOptions = {
    criticalSuccess:
      block.criticalSuccess !== undefined ? [block.criticalSuccess] : undefined,
    criticalFailure:
      block.criticalFailure !== undefined ? [block.criticalFailure] : undefined,
    with: block.with,
  };

  return {
    initialRoll: {
      type: "basic",
      args: {
        dice: getDice(block.counts),
        combine: block.combine,
        options: rollOptions,
      },
    },
    steps: block.steps.map((step) => buildCustomStepArgs(step)),
  } as CustomScenarioArgs;
}

function buildCustomStepArgs(step: CustomStep) {
  if (step.type === "modify") {
    return { type: "modify", modifier: step.amount };
  }
  if (step.type === "evaluate") {
    return { type: "against", difficulty: step.difficulty };
  }
  if (step.type === "and") {
    return {
      type: "and",
      combine: step.action,
      roll: buildRollBlockArgs(step),
    };
  }

  const after: Record<string, { combine: CombineAction; roll: unknown }> = {};
  for (const kind of Object.keys(step.branches) as ThenBranchKind[]) {
    const branch = step.branches[kind];
    if (branch) {
      after[kind] = {
        combine: branch.action,
        roll: buildRollBlockArgs(branch),
      };
    }
  }
  return { type: "then", after };
}

export function getScenario(roll: Roll): Scenario {
  switch (roll.kind) {
    case 'regular':
    return Scenario.pool({ dice: getDice(roll.counts), modifier: roll.modifier });
    case "tossLowest":
    return Scenario.custom({
      initialRoll: {
        type: "basic",
        args: { dice: getDice(roll.counts), combine: "tossLowest" },
      },
      steps: roll.modifier !== 0 ? [{ type: "modify", modifier: roll.modifier }] : [],
    } as CustomScenarioArgs);
    case "dhCheck":
    return Scenario.daggerheartCheck({
      difficulty: roll.difficulty,
      modifier: roll.modifier,
      options: {
        has: roll.advantage ? 'advantage' : roll.disadvantage ? 'disadvantage' : undefined,
      },
    });
    case "attack":
    return Scenario.attack({
      armor: roll.armor,
      modifier: roll.modifier,
      damageDice: getDice(roll.damageCounts),
      damageModifier: roll.damageModifier,
      options: {
        nat1s: roll.nat1s,
        has: roll.advantage ? 'advantage' : roll.disadvantage ? 'disadvantage' : undefined,
      },
    });
    case "spellSave":
    return Scenario.spellWithSave({
      dc: roll.dc,
      saveModifier: roll.saveModifier,
      damageDice: getDice(roll.damageCounts),
      damageModifier: roll.damageModifier,
      options: {
        nat1s: roll.nat1s,
        has: roll.advantage ? 'advantage' : roll.disadvantage ? 'disadvantage' : undefined,
        saveTakesHalf: roll.saveTakesHalf,
      },
    });
    case "custom":
      return Scenario.custom(buildRollBlockArgs(roll));
    default:
      return Scenario.check({
        difficulty: roll.difficulty,
        modifier: roll.modifier,
        options: {
          nat1s: roll.nat1s,
          has: roll.advantage ? 'advantage' : roll.disadvantage ? 'disadvantage' : undefined,
        },
      });
  }
}


export const CATEGORICAL_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

export function colorForIndex(index: number): string {
  return (
    CATEGORICAL_COLORS[index] ??
    CATEGORICAL_COLORS[CATEGORICAL_COLORS.length - 1]
  );
}

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    if (a === b) return 0;
    if (a === "none") return -1;
    if (b === "none") return 1;
    return a.localeCompare(b);
  });
}

