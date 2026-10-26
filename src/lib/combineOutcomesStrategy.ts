import { type Outcome } from "./outcome";

type Strategy =
  | {
      label: string;
      description: string;
      fn: (a: Outcome, b: Outcome) => Outcome;
      incremental: true;
    }
  | {
      label: string;
      description: string;
      fn: (o: Array<Outcome>) => Outcome;
      incremental: false;
    };

const STRATEGIES = {
  sum: {
    label: "Sum",
    description: "Sum the values of the outcomes",
    fn: (a: Outcome, b: Outcome): Outcome => ({ value: a.value + b.value }),
    incremental: true,
  },

  max: {
    label: "Max",
    description: "Use the outcome with the highest value",
    fn: (a: Outcome, b: Outcome): Outcome => (a.value > b.value ? a : b),
    incremental: true,
  },

  min: {
    label: "Min",
    description: "Use the outcome with the lowest value",
    fn: (a: Outcome, b: Outcome): Outcome => (a.value < b.value ? a : b),
    incremental: true,
  },

  hopeAndFear: {
    label: "Hope vs. Fear",
    description: "Sum the values and take the other info from the higher one",
    fn: (a: Outcome, b: Outcome): Outcome => {
      const value = a.value + b.value;
      return a.value === b.value
        ? { value, crit: true, success: true }
        : { value, with: a.value > b.value ? a.with : b.with };
    },
    incremental: true,
  },

  addValue: {
    label: "Add value",
    description:
      "Add the values and keep the status of the first roll/sequence",
    fn: (a: Outcome, b: Outcome): Outcome => ({
      ...a,
      value: a.value + b.value,
    }),
    incremental: true,
  },

  setValue: {
    label: "Damage",
    description:
      "Keep the status of the first roll/sequence and the value of the other",
    fn: (a: Outcome, b: Outcome): Outcome => ({ ...a, value: b.value }),
    incremental: true,
  },

  setHalf: {
    label: "Half damage",
    description:
      "Keep the status of the first roll/sequence and set the value to half the value of the other",
    fn: (a: Outcome, b: Outcome): Outcome => ({
      ...a,
      value: Math.floor(b.value / 2),
    }),
    incremental: true,
  },

  subtractValue: {
    label: "Subtract value",
    description: "any",
    fn: (a: Outcome, b: Outcome): Outcome => ({
      ...a,
      value: a.value - b.value,
    }),
    incremental: true,
  },

  tossLowest: {
    label: "Sum, toss the lowest value",
    description: "any",
    fn: (os: Array<Outcome>): Outcome => {
      const values = os.map((o) => o.value);
      return {
        value: values.reduce((a, b) => a + b) - Math.min(...values),
      };
    },
    incremental: false,
  },
  averageValue: {
    label: "Average",
    description: "Get the average value",
    fn: (os: Array<Outcome>): Outcome => {
      const values = os.map((o) => o.value);
      return {
        value: values.reduce((a, b) => a + b) / values.length,
      };
    },
    incremental: false,
  },
} as const satisfies Record<string, Strategy>;

export type CombineOutcomesStrategy = keyof typeof STRATEGIES;

export function combineFn(c: CombineOutcomesStrategy) {
  return STRATEGIES[c].fn;
}

export function isIncremental(
  fn: ((a: Outcome, b: Outcome) => Outcome) | ((o: Array<Outcome>) => Outcome),
): fn is (a: Outcome, b: Outcome) => Outcome {
  return fn.length === 2;
}

export function incrementalVersion(
  fn: ((a: Outcome, b: Outcome) => Outcome) | ((o: Array<Outcome>) => Outcome),
): (a: Outcome, b: Outcome) => Outcome {
  return isIncremental(fn) ? fn : (a: Outcome, b: Outcome) => fn([a, b]);
}

export function listCombiners(): Array<{
  value: CombineOutcomesStrategy;
  label: string;
  description: string;
}> {
  return (Object.keys(STRATEGIES) as CombineOutcomesStrategy[]).map(
    (value) => ({
      value,
      label: STRATEGIES[value].label,
      description: STRATEGIES[value].description,
    }),
  );
}

export function combineStrategyLabel(c: CombineOutcomesStrategy) {
  return STRATEGIES[c].label;
}
