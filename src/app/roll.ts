import { Scenario, DICE, type Die } from "@/lib/dice";
import { getCombiner, listCombiners, type Combiner } from "@/lib/outcome";

type CustomScenarioArgs = Parameters<typeof Scenario.custom>[0];

export type CombineAction = Combiner;

export const MAX_COUNT_PER_DIE = 20;
export const MIN_MODIFIER = -20;
export const MAX_MODIFIER = 20;
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 30;

export type DieCounts = Record<Die, number>;

// a plain pool of dice, optionally combined some way other than summing
// (e.g. advantage/disadvantage) and tagged for crits or hope/fear.
export type RegularInitialRoll = {
  kind: "regular";
  counts: DieCounts;
  modifier: number;
  combine: CombineAction;
  criticalSuccess?: number;
  criticalFailure?: number;
  with?: "hope" | "fear";
};

export type CheckInitialRoll = {
  kind: "check";
  difficulty: number;
  modifier: number;
  nat1s: boolean;
  advantage: boolean;
  disadvantage: boolean;
};

export type DaggerheartCheckInitialRoll = {
  kind: "dhCheck";
  difficulty: number;
  modifier: number;
  advantage: boolean;
  disadvantage: boolean;
};

export type AttackInitialRoll = {
  kind: "attack";
  armor: number;
  modifier: number;
  damageCounts: DieCounts;
  damageModifier: number;
  nat1s: boolean;
  advantage: boolean;
  disadvantage: boolean;
};

export type SpellSaveInitialRoll = {
  kind: "spellSave";
  dc: number;
  saveModifier: number;
  damageCounts: DieCounts;
  damageModifier: number;
  saveTakesHalf: boolean;
  nat1s: boolean;
  advantage: boolean;
  disadvantage: boolean;
};

export type InitialRoll =
  | RegularInitialRoll
  | CheckInitialRoll
  | DaggerheartCheckInitialRoll
  | AttackInitialRoll
  | SpellSaveInitialRoll;

export type ModifyStep = { id: string; type: "modify"; amount: number };
export type EvaluateStep = { id: string; type: "evaluate"; difficulty: number };

// the shape shared by every "and" step and every "then" branch: a flat dice
// pool plus a list of further steps.
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

// every roll is a flow chart: an initial roll (of any kind) followed by a
// list of further steps.
export type Roll = {
  id: string;
  name: string;
  initialRoll: InitialRoll;
  steps: CustomStep[];
};

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

export function createRegularInitialRoll(
  counts: DieCounts = INITIAL_COUNTS,
): RegularInitialRoll {
  return {
    kind: "regular",
    counts: { ...counts },
    modifier: 0,
    combine: "sum",
  };
}

export function createCheckInitialRoll(): CheckInitialRoll {
  return {
    kind: "check",
    difficulty: 15,
    modifier: 0,
    nat1s: false,
    advantage: false,
    disadvantage: false,
  };
}

export function createDaggerheartCheckInitialRoll(): DaggerheartCheckInitialRoll {
  return {
    kind: "dhCheck",
    difficulty: 15,
    modifier: 0,
    advantage: false,
    disadvantage: false,
  };
}

export function createAttackInitialRoll(): AttackInitialRoll {
  return {
    kind: "attack",
    armor: 15,
    modifier: 0,
    damageCounts: { ...EMPTY_COUNTS, 6: 1 },
    damageModifier: 0,
    nat1s: false,
    advantage: false,
    disadvantage: false,
  };
}

export function createSpellSaveInitialRoll(): SpellSaveInitialRoll {
  return {
    kind: "spellSave",
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

export function createInitialRoll(kind: InitialRoll["kind"]): InitialRoll {
  switch (kind) {
    case "regular":
      return createRegularInitialRoll(EMPTY_COUNTS);
    case "check":
      return createCheckInitialRoll();
    case "dhCheck":
      return createDaggerheartCheckInitialRoll();
    case "attack":
      return createAttackInitialRoll();
    case "spellSave":
      return createSpellSaveInitialRoll();
  }
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

export function createRoll(counts?: DieCounts): Roll {
  return {
    id: crypto.randomUUID(),
    name: "",
    initialRoll: createRegularInitialRoll(counts),
    steps: [],
  };
}

export function withInitialRollKind(
  roll: Roll,
  kind: InitialRoll["kind"],
): Roll {
  if (roll.initialRoll.kind === kind) return roll;
  return { ...roll, initialRoll: createInitialRoll(kind) };
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

function formatRegularInitialExpression(roll: RegularInitialRoll): string {
  const base = formatExpression(roll.counts, roll.modifier);
  if (!base) return "";

  const diceCount = DICE.reduce(
    (total, sides) => total + roll.counts[sides],
    0,
  );
  const rollPart =
    diceCount > 1 && roll.combine !== "sum"
      ? `${base} (${getCombiner(roll.combine).label.toLowerCase()})`
      : base;

  const tags: string[] = [];
  if (roll.criticalSuccess !== undefined) {
    tags.push(`crit success on ${roll.criticalSuccess}`);
  }
  if (roll.criticalFailure !== undefined) {
    tags.push(`crit failure on ${roll.criticalFailure}`);
  }
  if (roll.with) tags.push(`with ${roll.with}`);
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return rollPart + suffix;
}

export function formatCheckExpression(roll: CheckInitialRoll): string {
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
  roll: DaggerheartCheckInitialRoll,
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

export function formatAttackExpression(roll: AttackInitialRoll): string {
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

export function formatSpellSaveExpression(roll: SpellSaveInitialRoll): string {
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

function formatInitialRollExpression(initialRoll: InitialRoll): string {
  switch (initialRoll.kind) {
    case "regular":
      return formatRegularInitialExpression(initialRoll);
    case "check":
      return formatCheckExpression(initialRoll);
    case "dhCheck":
      return formatDaggerheartExpression(initialRoll);
    case "attack":
      return formatAttackExpression(initialRoll);
    case "spellSave":
      return formatSpellSaveExpression(initialRoll);
  }
}

const THEN_BRANCH_LABEL: Record<ThenBranchKind, string> = {
  success: "success",
  failure: "failure",
  criticalSuccess: "critical success",
  criticalFailure: "critical failure",
};

export function getRollDisplayName(roll: Roll, index: number): string {
  return roll.name.trim() || `Roll ${index + 1}`;
}

export function formatRollLabel(roll: Roll): string {
  const base = formatInitialRollExpression(roll.initialRoll);
  const parts = base ? [base] : [];

  for (const step of roll.steps) {
    if (step.type === "modify") {
      parts.push(`${step.amount >= 0 ? "+" : "-"} ${Math.abs(step.amount)}`);
    } else if (step.type === "evaluate") {
      parts.push(`vs DC ${step.difficulty}`);
    } else if (step.type === "and") {
      const dice = formatExpression(step.counts, 0);
      if (dice) {
        parts.push(
          `and ${dice} (${getCombiner(step.action).label.toLowerCase()})`,
        );
      }
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

  return parts.join(" ");
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

function buildInitialRollArgs(initialRoll: InitialRoll) {
  switch (initialRoll.kind) {
    case "regular": {
      const rollOptions = {
        criticalSuccess:
          initialRoll.criticalSuccess !== undefined
            ? [initialRoll.criticalSuccess]
            : undefined,
        criticalFailure:
          initialRoll.criticalFailure !== undefined
            ? [initialRoll.criticalFailure]
            : undefined,
        with: initialRoll.with,
      };
      return {
        type: "basic",
        args: {
          dice: getDice(initialRoll.counts),
          combine: initialRoll.combine,
          options: rollOptions,
        },
      };
    }
    case "check":
      return {
        type: "check",
        args: {
          difficulty: initialRoll.difficulty,
          modifier: initialRoll.modifier,
          options: {
            nat1s: initialRoll.nat1s,
            has: initialRoll.advantage
              ? "advantage"
              : initialRoll.disadvantage
                ? "disadvantage"
                : undefined,
          },
        },
      };
    case "dhCheck":
      return {
        type: "daggerheartCheck",
        args: {
          difficulty: initialRoll.difficulty,
          modifier: initialRoll.modifier,
          options: {
            has: initialRoll.advantage
              ? "advantage"
              : initialRoll.disadvantage
                ? "disadvantage"
                : undefined,
          },
        },
      };
    case "attack":
      return {
        type: "attack",
        args: {
          armor: initialRoll.armor,
          modifier: initialRoll.modifier,
          damageDice: getDice(initialRoll.damageCounts),
          damageModifier: initialRoll.damageModifier,
          options: {
            nat1s: initialRoll.nat1s,
            has: initialRoll.advantage
              ? "advantage"
              : initialRoll.disadvantage
                ? "disadvantage"
                : undefined,
          },
        },
      };
    case "spellSave":
      return {
        type: "spellWithSave",
        args: {
          dc: initialRoll.dc,
          saveModifier: initialRoll.saveModifier,
          damageDice: getDice(initialRoll.damageCounts),
          damageModifier: initialRoll.damageModifier,
          options: {
            nat1s: initialRoll.nat1s,
            has: initialRoll.advantage
              ? "advantage"
              : initialRoll.disadvantage
                ? "disadvantage"
                : undefined,
            saveTakesHalf: initialRoll.saveTakesHalf,
          },
        },
      };
  }
}

export function getScenario(roll: Roll): Scenario {
  const initialRollArgs = buildInitialRollArgs(roll.initialRoll);
  const modifierStep =
    roll.initialRoll.kind === "regular" && roll.initialRoll.modifier !== 0
      ? [{ type: "modify", modifier: roll.initialRoll.modifier }]
      : [];

  return Scenario.custom({
    initialRoll: initialRollArgs,
    steps: [...modifierStep, ...roll.steps.map((step) => buildCustomStepArgs(step))],
  } as CustomScenarioArgs);
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
