import { Outcome, label, isFailure, isSuccess, isCriticalSuccess, Combiner, getCombiner, incrementalVersion } from './outcome';

export const DICE = [4, 6, 8, 10, 12, 20, 100] as const;
export type Die = (typeof DICE)[number];
type Dice = Array<Die>

export type BasicRoll = {
  type: 'basic',
  args: { die: Die; dice?: never, options?: RollOptions } |
  { dice: Dice; die?: never, options?: RollOptions, combine: Combiner }
}
export type DamageRoll = { type: 'damage', args: Parameters<typeof Scenario['damage']>[0] }
export type CheckRoll = { type: 'check', args: Parameters<typeof Scenario['check']>[0] }
export type DaggerheartCheckRoll = { type: 'daggerheartCheck', args: Parameters<typeof Scenario['daggerheartCheck']>[0] }
export type AttackRoll = { type: 'attack', args: Parameters<typeof Scenario['attack']>[0] };
export type SpellRoll = { type: 'spellWithSave', args: Parameters<typeof Scenario['spellWithSave']>[0] }

export type Roll =
  BasicRoll |
  DamageRoll |
  CheckRoll |
  DaggerheartCheckRoll |
  AttackRoll |
  SpellRoll;

export type AndStep = { type: 'and', combine: Combiner, roll: RollSequence };
export type ModifyStep = { type: 'modify', modifier: number  };
export type AgainstStep = { type: 'against', difficulty: number  };
export type ThenStep = {
  type: 'then',
  after: {
    success?: { combine: Combiner, roll: RollSequence },
    failure?: { combine: Combiner, roll: RollSequence },
    criticalSuccess?: { combine: Combiner, roll: RollSequence },
    criticalFailure?: { combine: Combiner, roll: RollSequence },
  }
}

export type Step = AndStep | ModifyStep | AgainstStep | ThenStep;

export type RollSequence = { initialRoll: Roll, steps: Array<Step> };

export type RollOptions = {
  criticalSuccess?: number,
  criticalFailure?: number,
  with?: 'hope' | 'fear',
}

export class Scenario {
  private data: Array<Outcome & { p: number }>;

  protected constructor(data: Array<Outcome & { p: number }>) {
    this.data = data;
  }

  public result(): Array<{ value: number, label: string, p: number }> {
    return this.data.map(o => ({ ...o, label: label(o) }));
  }

  public expectedValue(): number {
    return this.data.reduce((total, { value, p }) => total + value * p, 0);
  }

  static rollDie({ die, options = {} }: { die: Die, options?: RollOptions }) {
    const values = integers(1, die);
    return new Scenario(
      values.map((value) => {
        const criticalSuccess = options.criticalSuccess && value >= options.criticalSuccess;
        const criticalFailure = options.criticalFailure && value <= options.criticalFailure;
        return {
          value,
          p: 1 / die,
          with: options.with,
          crit: criticalSuccess || criticalFailure || undefined,
          success: criticalSuccess ? true : criticalFailure ? false : undefined,
        };
      }
    ));
  }

  static rollDice({ dice: [ first, ...rest ], combine, options = {} }: { dice: Dice, combine: Combiner, options?: RollOptions }): Scenario {
    if (!first) return new Scenario([]);

    return this.rollDie({ die: first, options }).and(
      rest.map((die) => this.rollDie({ die, options })),
      combine
    );
  }

  static singleOutcome(o: Outcome) {
    return new Scenario([{ ...o, p: 1 }]);
  }

  // a standard pool of dice summed together
  static damage({ dice, modifier = 0 }: { dice: Dice, modifier?: number }) {
    return this.rollDice({ dice, combine: 'sum' }).modify(modifier);
  }

  // a DND "skill check" roll using one or 2 d20 with a set difficulty and a skill modifier
  static check({ difficulty, modifier, options = {} }: {
    difficulty: number,
    modifier: number,
    options?: { nat1s?: boolean; has?: 'advantage' | 'disadvantage'; }
  }) {
    const crits = { criticalSuccess: 20, criticalFailure: options.nat1s ? 1 : undefined };

    return this.rollDie({ die: 20, options: crits })
      .then(options.has === 'advantage', this.rollDie({ die: 20, options: crits }), 'max')
      .then(options.has === 'disadvantage', this.rollDie({ die: 20, options: crits }), 'min')
      .modify(modifier)
      .evaluate(difficulty)
      .condense();
  }

  // a Daggerheart-style check roll with hope and fear
  static daggerheartCheck({ difficulty, modifier = 0, options = {} }:
    { difficulty: number,
    modifier?: number,
    options?: { has?: 'advantage' | 'disadvantage'; }
  }) {
    return this.rollDie({ die: 12, options: { with: 'hope' } })
      .and(this.rollDie({ die: 12, options: { with: 'fear' } }), 'hopeAndFear')
      .then(options.has === 'advantage', this.rollDie({ die: 6 }), 'addValue')
      .then(options.has === 'disadvantage', this.rollDie({ die: 6 }), 'subtractValue')
      .modify(modifier)
      .evaluate(difficulty)
  }

  // a DND attack roll and then subsequent damage
  static attack({ armor, modifier = 0, damageDice, damageModifier = 0, options = {} }:
    {
    armor: number,
    modifier: number,
    damageDice: Dice,
    damageModifier?: number,
    options?: { nat1s?: boolean; has?: 'advantage' | 'disadvantage'; },
    }
  ) {
    return this.check({ difficulty: armor, modifier, options })
      .then((o) => (o.crit && o.success) ?? false, this.damage({ dice: [ ...damageDice, ...damageDice ], modifier: damageModifier }), 'setValue')
      .then((o) => (!o.crit && o.success) ?? false, this.damage({ dice: damageDice, modifier: damageModifier }), 'setValue')
      .then((o) => !o.success, new Scenario([{ value: 0, p: 1 }]), 'setValue')
      .condense()
  }

  // a DND spell with an opposing save roll and subsequent damage
  static spellWithSave({ dc, saveModifier = 0, damageDice, damageModifier = 0, options = {} }: {
    dc: number,
    saveModifier?: number,
    damageDice: Dice,
    damageModifier?: number,
    options?: { nat1s?: boolean; has?: 'advantage' | 'disadvantage'; saveTakesHalf?: boolean; },
  }) {
    return this.check({ difficulty: dc, modifier: saveModifier, options })
      .then(
        isFailure,
        this.damage({ dice: damageDice, modifier: damageModifier }),
        'setValue',
      )
      .then(
        isSuccess,
        options.saveTakesHalf ?
          this.damage({ dice: damageDice, modifier: damageModifier }) :
          this.singleOutcome({ value: 0 }),
        'setHalf',
      )
      .condense()
  }

  // build a custom roll or sequence of rolls
  static custom({ initialRoll: roll, steps }: RollSequence) {
    let scenario: Scenario;
    switch (roll.type) {
      case 'basic':
        scenario = roll.args.die ? this.rollDie(roll.args) : this.rollDice(roll.args);
        break;
      case 'damage':
        scenario = this.damage(roll.args);
        break;
      case 'check':
        scenario = this.check(roll.args);
        break;
      case 'daggerheartCheck':
        scenario = this.daggerheartCheck(roll.args);
        break;
      case 'attack':
        scenario = this.attack(roll.args);
        break;
      case 'spellWithSave':
        scenario = this.spellWithSave(roll.args);
        break;
      default:
        assertNever(roll);
        throw new Error('unexpected roll type');
    }

    return steps.reduce((scenario: Scenario, step: Step): Scenario => {
      switch (step.type) {
        case 'and':
          return scenario.and(Scenario.custom(step.roll), step.combine)
        case 'modify':
          return scenario.modify(step.modifier);
        case 'against':
          return scenario.evaluate(step.difficulty);
        case 'then': {
          const { success, failure, criticalSuccess, criticalFailure } = step.after;
          if (success) scenario.then((o) => o.success === true, Scenario.custom(success.roll), success.combine)
          if (failure) scenario.then((o) => !o.success, Scenario.custom(failure.roll), failure.combine)
          if (criticalSuccess) scenario.then((o) => o.success === true && o.crit === true, Scenario.custom(criticalSuccess.roll), criticalSuccess.combine)
          if (criticalFailure) scenario.then((o) => !o.success && o.crit === true, Scenario.custom(criticalFailure.roll), criticalFailure.combine,)
          return scenario;
        }
      }
    }, scenario);
  }

  private and(other: Scenario | Array<Scenario>, combine: Combiner) {
    const others = other instanceof Scenario ? [ other ] : other;
    if (others.length < 1) return this;

    const combiner = getCombiner(combine);
    if (others.length > 1 && combiner.incremental === false) {
      return this._andAllTogether(others, combiner.fn)
    }

    return others.reduce((a, v) => a._andIncremental(v, incrementalVersion(combiner)), this);
  }

  // combine outcomes two at a time
  private _andIncremental(other: Scenario, combine: (a: Outcome, b: Outcome) => Outcome) {
    this.data = this.data
      .map((x) => other.data.map((y) => ({ ...combine(x, y), p: x.p * y.p })))
      .flat();

    return this.condense();
  }

  // combine outcomes that must be combined all at once, ie: dropping the lowest value or taking the average
  private _andAllTogether(others: Array<Scenario>, combine: (o: Array<Outcome>) => Outcome) {
    this.data = [
      this.data, ...others.map(s => s.data)
    ]
    // get the cartesian product of all outcomes
    .reduce(
      (a, v) => v.map(o => a.map(os => [ ...os, o ])).flat(),
      [ [ ] ] as Array<Array<Outcome & { p: number }>>
    )
    // get the single resulting outcome in each case
    .map(os => ({
      ...combine(os),
      p: os.reduce((a, b) => a * b.p, 1),
    }))

    return this.condense();
  }

  private then(check: boolean | ((o: Outcome) => boolean), next: Scenario, combine: Combiner) {
    if (check === false) return this;
    if (check === true) return this.and(next, combine);

    const combineFn = incrementalVersion(getCombiner(combine));
    this.data = this.data
      .map((x) => check(x) ? next.data.map((y) => ({ ...combineFn(x, y), p: x.p * y.p })) : [ x ])
      .flat();

    return this.condense();
  }

  private modify(modifier: number = 0) {
    this.data = this.data.map((o) => ({ ...o, value: o.value + modifier }));
    return this;
  }

  private evaluate(difficulty: number) {
    this.data = this.data.map((o) => ({
      ...o, success: o.success ?? o.value >= difficulty
    }));
    return this.condense();
  }


  private condense(): Scenario {
    // this merges equivalent outcomes

    const compare = (a: Outcome, b: Outcome) =>
      a.value != b.value ? a.value - b.value :
      label(a) === label(b) ? 0 :
      label(a) < label(b) ? -1 :
      1;

    this.data = this.data
      .sort(compare)
      .reduce((a, next) => {
        const last = a.pop();
        if (!last) return [next];
        if (compare(last, next) === 0) {
          a.push({ ...last, p: last.p + next.p });
        } else {
          a.push(last, next);
        }
        return a;
      },
      [] as Scenario["data"],
    );

    return this;
  }
}

function integers(first: number, last: number): number[] {
  const length = last - first + 1;
  if (length < 1) return [];
  return Array.from({ length }, (_, i) => i + first);
}

function assertNever(value: never): never {
  return value;
}

