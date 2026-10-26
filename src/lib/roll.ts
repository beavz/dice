import { type Die, type Dice, diceToString } from "./dice";
import { type Combiner, getCombiner } from "./outcome";

export type RollOptions = {
  criticalSuccess?: number;
  criticalFailure?: number;
  with?: "hope" | "fear";
};

export type BasicRoll = {
  type: "basic";
  args:
    | { die: Die; dice?: never; options?: RollOptions }
    | { dice: Dice; die?: never; options?: RollOptions; combine: Combiner };
};
export type DamageRoll = {
  type: "damage";
  args: { dice: Dice; modifier?: number };
};
export type CheckRoll = {
  type: "check";
  args: {
    difficulty: number;
    modifier: number;
    options?: { nat1s?: boolean; has?: "advantage" | "disadvantage" };
  };
};
export type DaggerheartCheckRoll = {
  type: "daggerheartCheck";
  args: {
    difficulty: number;
    modifier?: number;
    options?: { has?: "advantage" | "disadvantage" };
  };
};
export type AttackRoll = {
  type: "attack";
  args: {
    armor: number;
    modifier: number;
    damageDice: Dice;
    damageModifier?: number;
    options?: { nat1s?: boolean; has?: "advantage" | "disadvantage" };
  };
};
export type SpellRoll = {
  type: "spellWithSave";
  args: {
    dc: number;
    saveModifier?: number;
    damageDice: Dice;
    damageModifier?: number;
    options?: {
      nat1s?: boolean;
      has?: "advantage" | "disadvantage";
      saveTakesHalf?: boolean;
    };
  };
};

export type Roll =
  | BasicRoll
  | DamageRoll
  | CheckRoll
  | DaggerheartCheckRoll
  | AttackRoll
  | SpellRoll;

type RollType = Roll["type"];

type RollOfType<T extends RollType> = Extract<Roll, { type: T }>;

const ROLLS: {
  [T in RollType]: {
    initialize: () => RollOfType<T>;
    label: (roll: RollOfType<T>) => string;
  }
} = {
  basic: {
    initialize: () => ({ type: "basic", args: { die: 20 } }),
    label: (roll: BasicRoll): string => {
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
    label: (roll: DamageRoll) => {
      return diceToString(roll.args.dice, roll.args.modifier);
    },
  },
  check: {
    initialize: () => ({
      type: "check",
      args: { difficulty: 15, modifier: 0 },
    }),
    label: (roll: CheckRoll) => {
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
  },
  daggerheartCheck: {
    initialize: () => ({ type: "daggerheartCheck", args: { difficulty: 15 } }),
    label: (roll: DaggerheartCheckRoll) => {
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
  },
  attack: {
    initialize: () => ({
      type: "attack",
      args: { armor: 16, modifier: 0, damageDice: [6] },
    }),
    label: (roll: AttackRoll) => {
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
  },
  spellWithSave: {
    initialize: () => ({
      type: "spellWithSave",
      args: { dc: 14, damageDice: [12, 12] },
    }),
    label: (roll: SpellRoll) => {
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
  },
}

export function initializeRoll(type: RollType): Roll {
  return ROLLS[type].initialize();
}

export function getRollLabel<T extends RollType>(roll: RollOfType<T>): string {
  return ROLLS[roll.type].label(roll);
}
