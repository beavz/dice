import type { CombineOutcomesStrategy } from "./combineOutcomesStrategy";
import { type Roll, getRollLabel } from "./roll";

export type AndStep = {
  type: "and";
  combine: CombineOutcomesStrategy;
  roll: RollSequence;
};
export type ModifyStep = { type: "modify"; modifier: number };
export type AgainstStep = { type: "against"; difficulty: number };
export type ThenStep = {
  type: "then";
  after: {
    success?: { combine: CombineOutcomesStrategy; roll: RollSequence };
    failure?: { combine: CombineOutcomesStrategy; roll: RollSequence };
    criticalSuccess?: { combine: CombineOutcomesStrategy; roll: RollSequence };
    criticalFailure?: { combine: CombineOutcomesStrategy; roll: RollSequence };
  };
};

export type Step = AndStep | ModifyStep | AgainstStep | ThenStep;

export type RollSequence = {
  initialRoll: Roll;
  steps: Array<Step>;
  name?: string;
};

export function getSequenceLabel(roll: RollSequence): string {
  if (roll.name) return roll.name.trim();
  if (roll.steps.length === 0) return getRollLabel(roll.initialRoll);
  return "Custom roll sequence";
}
