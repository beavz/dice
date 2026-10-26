import { DistributionBuilder } from "@/lib/DistributionBuilder";
import {
  type Roll,
  type BasicRoll,
  type DamageRoll,
  type CheckRoll,
  type DaggerheartCheckRoll,
  type AttackRoll,
  type SpellRoll,
  type RollOptions,
} from "@/lib/roll";
import {
  type AndStep,
  type ThenStep,
  type Step,
  type RollSequence,
} from "@/lib/rollSequence";
import { type Die, diceToString } from "@/lib/dice";
import { getCombiner, type Combiner } from "@/lib/outcome";
import {
  type Counts,
  countsFromDice,
  getDice,
} from "@/components/DiceField";

export type CombineAction = Combiner;

const ROLLS = {
  basic: {
    initialize: () => ({ type: "basic", args: { die: 20 } }),
    expression: (roll: BasicRoll): string => {
      const dice =
        roll.args.die !== undefined ? [roll.args.die] : roll.args.dice;
      const base = diceToString(dice);

      const combine = roll.args.die !== undefined ? "sum" : roll.args.combine;
      const rollPart =
        dice.length > 1 && combine !== "sum"
          ? `${base} (${getCombiner(combine).label.toLowerCase()})`
          : base;

      const options = roll.args.options ?? {};
      const tags: string[] = [];
      if (options.criticalSuccess !== undefined) {
        tags.push(`crit success on ${options.criticalSuccess}`);
      }
      if (options.criticalFailure !== undefined) {
        tags.push(`crit failure on ${options.criticalFailure}`);
      }
      if (options.with) tags.push(`with ${options.with}`);
      const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

      return rollPart + suffix;
    },
  },
  damage: {
    initialize: () => ({ type: "damage", args: { dice: [8, 8], modifier: 0 } }),
    expression: (roll: DamageRoll) => {
      return diceToString(roll.args.dice, roll.args.modifier);
    },
  },
  check: {
    initialize: () => ({
      type: "check",
      args: { difficulty: 15, modifier: 0 },
    }),
    expression: (roll: any) => "",
  },
  daggerheartCheck: {
    initialize: () => ({ type: "daggerheartCheck", args: { difficulty: 15 } }),
    expression: (roll: any) => "",
  },
  attack: {
    initialize: () => ({
      type: "attack",
      args: { armor: 16, modifier: 0, damageDice: [6] },
    }),
    expression: (roll: any) => "",
  },
  spellWithSave: {
    initialize: () => ({
      type: "spellWithSave",
      args: { dc: 14, damageDice: [12, 12] },
    }),
    expression: (roll: any) => "",
  },
} satisfies Record<Roll["type"], { initialize: () => Roll; expression?: any }>;

function createInitialRoll(type: Roll["type"]): Roll {
  return ROLLS[type].initialize();
}

export function createThenStep(): ThenStep {
  return {
    type: "then",
    after: {},
  };
}

export function createAndStep(): AndStep {
  return {
    type: "and",
    combine: "sum",
    roll: {
      initialRoll: ROLLS.basic.initialize(),
      steps: [],
    },
  };
}

export function createRoll(counts: Counts = { 20: 1 }): RollSequence {
  return {
    initialRoll: {
      type: "basic",
      args: { dice: getDice(counts), combine: "sum" },
    },
    steps: [],
  };
}

export function withInitialRollKind<T extends { initialRoll: Roll }>(
  roll: T,
  type: Roll["type"],
): T {
  if (roll.initialRoll.type === type) return roll;
  return { ...roll, initialRoll: createInitialRoll(type) };
}

function formatBasicExpression(roll: BasicRoll): string {
  return ROLLS.basic.expression(roll);
}

function formatDamageExpression(roll: DamageRoll): string {
  return ROLLS.damage.expression(roll);
}

function formatCheckExpression(roll: CheckRoll): string {
  const { difficulty, modifier, options = {} } = roll.args;
  const parts = [`DC ${difficulty} check`];
  if (modifier !== 0) {
    const sign = modifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(modifier)}`);
  }

  const tags: string[] = [];
  if (options.has === "advantage") tags.push("advantage");
  if (options.has === "disadvantage") tags.push("disadvantage");
  if (options.nat1s) tags.push("nat 1 crit-fails");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

function formatDaggerheartExpression(roll: DaggerheartCheckRoll): string {
  const { difficulty, modifier = 0, options = {} } = roll.args;
  const parts = [`DC ${difficulty} Daggerheart check`];
  if (modifier !== 0) {
    const sign = modifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(modifier)}`);
  }

  const tags: string[] = [];
  if (options.has === "advantage") tags.push("advantage");
  if (options.has === "disadvantage") tags.push("disadvantage");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

function formatAttackExpression(roll: AttackRoll): string {
  const {
    armor,
    modifier,
    damageDice,
    damageModifier = 0,
    options = {},
  } = roll.args;
  const parts = [`AC ${armor} attack`];
  if (modifier !== 0) {
    const sign = modifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(modifier)}`);
  }

  const damage = diceToString(damageDice, damageModifier);
  if (damage) parts.push(`→ ${damage} damage`);

  const tags: string[] = [];
  if (options.has === "advantage") tags.push("advantage");
  if (options.has === "disadvantage") tags.push("disadvantage");
  if (options.nat1s) tags.push("nat 1 crit-fails");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

function formatSpellSaveExpression(roll: SpellRoll): string {
  const {
    dc,
    saveModifier = 0,
    damageDice,
    damageModifier = 0,
    options = {},
  } = roll.args;
  const parts = [`DC ${dc} save`];
  if (saveModifier !== 0) {
    const sign = saveModifier > 0 ? "+" : "-";
    parts.push(`${sign} ${Math.abs(saveModifier)}`);
  }

  const damage = diceToString(damageDice, damageModifier);
  if (damage) {
    parts.push(
      `→ ${damage} damage${options.saveTakesHalf ? " (half on save)" : ""}`,
    );
  }

  const tags: string[] = [];
  if (options.has === "advantage") tags.push("advantage");
  if (options.has === "disadvantage") tags.push("disadvantage");
  if (options.nat1s) tags.push("nat 1 crit-fails");
  const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";

  return parts.join(" ") + suffix;
}

function formatInitialRollExpression(initialRoll: Roll): string {
  switch (initialRoll.type) {
    case "basic":
      return formatBasicExpression(initialRoll);
    case "damage":
      return formatDamageExpression(initialRoll);
    case "check":
      return formatCheckExpression(initialRoll);
    case "daggerheartCheck":
      return formatDaggerheartExpression(initialRoll);
    case "attack":
      return formatAttackExpression(initialRoll);
    case "spellWithSave":
      return formatSpellSaveExpression(initialRoll);
  }
}

export function getRollDisplayName(
  roll: RollSequence,
  index: number,
): string {
  return roll.name?.trim() || `Roll ${index + 1}`;
}

export function formatRollLabel(roll: RollSequence): string {
  return "Custom roll sequence";
}

export type DistributionPoint = { value: number; label: string; p: number };

export function getDistributionBuilder(
  roll: RollSequence,
): DistributionBuilder {
  return DistributionBuilder.custom(roll);
}

export function getDiceOf(initialRoll: BasicRoll): Die[] {
  return initialRoll.args.die !== undefined
    ? [initialRoll.args.die]
    : initialRoll.args.dice;
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
