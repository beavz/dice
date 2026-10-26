import type { Die, Dice } from "./dice";
import type { Combiner } from "./outcome";

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
