import type { Combiner } from "./outcome";
import type { Roll } from "./roll";

export type AndStep = { type: "and"; combine: Combiner; roll: RollSequence };
export type ModifyStep = { type: "modify"; modifier: number };
export type AgainstStep = { type: "against"; difficulty: number };
export type ThenStep = {
  type: "then";
  after: {
    success?: { combine: Combiner; roll: RollSequence };
    failure?: { combine: Combiner; roll: RollSequence };
    criticalSuccess?: { combine: Combiner; roll: RollSequence };
    criticalFailure?: { combine: Combiner; roll: RollSequence };
  };
};

export type Step = AndStep | ModifyStep | AgainstStep | ThenStep;

export type RollSequence = {
  initialRoll: Roll;
  steps: Array<Step>;
  name?: string;
};
