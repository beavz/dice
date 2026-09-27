export type Outcome = { value: number; crit?: true; success?: boolean; with?: 'hope' | 'fear' };

export function label(o: Outcome) {
  return `${o.crit ? 'critical ' : ''}${o.success ? 'success' : o.success === false ? 'failure' : 'roll'}${o.with ? ' with ' : ''}${o.with ?? ''}`
}

export function isSuccess(o: Outcome) {
  return o.success === true;
}

export function isFailure(o: Outcome) {
  return o.success === false;
}

export function isCriticalSuccess(o: Outcome) {
  return isSuccess(o) && o.crit === true;
}

export function isCriticalFailure(o: Outcome) {
  return isFailure(o) && o.crit === true;
}

type CombinerDefinition = {
  label: string,
  description: string,
  fn: (a: Outcome, b: Outcome) => Outcome,
  incremental: true,
} | {
  label: string,
  description: string,
  fn: (o: Array<Outcome>) => Outcome,
  incremental: false,
}

const COMBINERS = {
  sum: {
    label: 'Sum',
    description: 'Sum the values of the outcomes',
    fn: (a: Outcome, b: Outcome): Outcome => ({ value: a.value + b.value }),
    incremental: true,
  },

  max: {
    label: 'Max',
    description: 'Use the outcome with the highest value',
    fn: (a: Outcome, b: Outcome): Outcome => a.value > b.value ? a : b,
    incremental: true,
  },

  min: {
    label: 'Min',
    description: 'Use the outcome with the lowest value',
    fn: (a: Outcome, b: Outcome): Outcome => a.value < b.value ? a : b,
    incremental: true,
  },

  hopeAndFear: {
    label: 'Hope vs. Fear',
    description: 'Sum the values and take the other info from the higher one',
    fn: (a: Outcome, b: Outcome): Outcome => {
      const value = a.value + b.value;
      return (a.value === b.value) ?
        { value, crit: true, success: true } :
        { value, with: a.value > b.value ? a.with : b.with };
    },
    incremental: true,
  },

  addValue: {
    label: 'Add value',
    description: 'Add the values and keep the status of the first roll/sequence',
    fn: (a: Outcome, b: Outcome): Outcome => ({ ...a, value: a.value + b.value }),
    incremental: true,
  },

  setValue: {
    label: 'Damage',
    description: 'Keep the status of the first roll/sequence and the value of the other',
    fn: (a: Outcome, b: Outcome): Outcome => ({ ...a, value: b.value }),
    incremental: true,
  },

  setHalf: {
    label: 'Half damage',
    description: 'Keep the status of the first roll/sequence and set the value to half the value of the other',
    fn: (a: Outcome, b: Outcome): Outcome => ({ ...a, value: Math.floor(b.value / 2) }),
    incremental: true,
  },

  subtractValue: {
    label: 'Subtract value',
    description: 'any',
    fn: (a: Outcome, b: Outcome): Outcome => ({ ...a, value: a.value - b.value }),
    incremental: true,
  },

  tossLowest: {
    label: 'Sum, toss the lowest value',
    description: 'any',
    fn: (os: Array<Outcome>): Outcome => {
      const values = os.map(o => o.value);
      return {
        value: values.reduce((a, b) => a + b) - Math.min(...values),
      }
    },
    incremental: false,
  },
  averageValue: {
    label: 'Average',
    description: 'Get the average value',
    fn: (os: Array<Outcome>): Outcome => {
      const values = os.map(o => o.value);
      return {
        value: values.reduce((a, b) => a + b) / values.length,
      }
    },
    incremental: false,
  }
} satisfies Record<string, CombinerDefinition>;

export type Combiner = keyof typeof COMBINERS;

export function incrementalVersion(c: CombinerDefinition) {
  return c.incremental ? c.fn : (a: Outcome, b: Outcome) => c.fn([ a, b ]);
}

export function getCombiner(t: Combiner) {
  return COMBINERS[t];
}

export function listCombiners(): Array<{
  value: Combiner;
  label: string;
  description: string;
}> {
  return (Object.keys(COMBINERS) as Combiner[]).map((value) => ({
    value,
    label: COMBINERS[value].label,
    description: COMBINERS[value].description,
  }));
}
