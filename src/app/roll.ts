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
  initializeRoll,
  getRollLabel,
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
      initialRoll: initializeRoll('basic'),
      steps: [],
    },
  };
}


export function withInitialRollKind<T extends { initialRoll: Roll }>(
  roll: T,
  type: Roll["type"],
): T {
  if (roll.initialRoll.type === type) return roll;
  return { ...roll, initialRoll: initializeRoll(type) };
}

export function getRollDisplayName(
  roll: RollSequence,
  index: number,
): string {
  return roll.name?.trim() || `Roll ${index + 1}`;
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
