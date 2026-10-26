import {
  Outcome,
  label,
  isFailure,
  isSuccess,
  isCriticalSuccess,
  Combiner,
  getCombiner,
  incrementalVersion,
} from "./outcome";
import type {
  RollOptions,
  BasicRoll,
  DamageRoll,
  CheckRoll,
  DaggerheartCheckRoll,
  AttackRoll,
  SpellRoll,
  Roll,
} from "./roll";
import type { Die, Dice } from "./dice";
import type { Step, RollSequence } from "./rollSequence";

export type OutcomeDistribution = Array<Outcome & { p: number }>;
export type CategorizedOutcomeDistribution = Array<Outcome & { p: number; label: string }>;

export class DistributionBuilder {
  static getResult(sequence: RollSequence): CategorizedOutcomeDistribution {
    return this.custom(sequence).result();
  }

  private data: OutcomeDistribution;

  protected constructor(data: OutcomeDistribution) {
    this.data = data;
  }

  private result(): CategorizedOutcomeDistribution {
    return this.data.map((o) => ({ ...o, label: label(o) }));
  }

  protected static rollDie({ die, options = {} }: { die: Die; options?: RollOptions }) {
    const values = integers(1, die);
    return new DistributionBuilder(
      values.map((value) => {
        const criticalSuccess =
          options.criticalSuccess && value >= options.criticalSuccess;
        const criticalFailure =
          options.criticalFailure && value <= options.criticalFailure;
        return {
          value,
          p: 1 / die,
          with: options.with,
          crit: criticalSuccess || criticalFailure || undefined,
          success: criticalSuccess ? true : criticalFailure ? false : undefined,
        };
      }),
    );
  }

  protected static rollDice({
    dice: [first, ...rest],
    combine,
    options = {},
  }: {
    dice: Dice;
    combine: Combiner;
    options?: RollOptions;
  }): DistributionBuilder {
    if (!first) return new DistributionBuilder([]);

    return this.rollDie({ die: first, options }).and(
      rest.map((die) => this.rollDie({ die, options })),
      combine,
    );
  }

  protected static singleOutcome(o: Outcome) {
    return new DistributionBuilder([{ ...o, p: 1 }]);
  }

  // a standard pool of dice summed together
  protected static damage({ dice, modifier = 0 }: DamageRoll["args"]) {
    return this.rollDice({ dice, combine: "sum" }).modify(modifier);
  }

  // a DND "skill check" roll using one or 2 d20 with a set difficulty and a skill modifier
  protected static check({ difficulty, modifier, options = {} }: CheckRoll["args"]) {
    const crits = {
      criticalSuccess: 20,
      criticalFailure: options.nat1s ? 1 : undefined,
    };

    return this.rollDie({ die: 20, options: crits })
      .then(
        options.has === "advantage",
        this.rollDie({ die: 20, options: crits }),
        "max",
      )
      .then(
        options.has === "disadvantage",
        this.rollDie({ die: 20, options: crits }),
        "min",
      )
      .modify(modifier)
      .evaluate(difficulty)
      .condense();
  }

  // a Daggerheart-style check roll with hope and fear
  protected static daggerheartCheck({
    difficulty,
    modifier = 0,
    options = {},
  }: DaggerheartCheckRoll["args"]) {
    return this.rollDie({ die: 12, options: { with: "hope" } })
      .and(this.rollDie({ die: 12, options: { with: "fear" } }), "hopeAndFear")
      .then(options.has === "advantage", this.rollDie({ die: 6 }), "addValue")
      .then(
        options.has === "disadvantage",
        this.rollDie({ die: 6 }),
        "subtractValue",
      )
      .modify(modifier)
      .evaluate(difficulty);
  }

  // a DND attack roll and then subsequent damage
  protected static attack({
    armor,
    modifier = 0,
    damageDice,
    damageModifier = 0,
    options = {},
  }: AttackRoll["args"]) {
    return this.check({ difficulty: armor, modifier, options })
      .then(
        (o) => (o.crit && o.success) ?? false,
        this.damage({
          dice: [...damageDice, ...damageDice],
          modifier: damageModifier,
        }),
        "setValue",
      )
      .then(
        (o) => (!o.crit && o.success) ?? false,
        this.damage({ dice: damageDice, modifier: damageModifier }),
        "setValue",
      )
      .then(
        (o) => !o.success,
        new DistributionBuilder([{ value: 0, p: 1 }]),
        "setValue",
      )
      .condense();
  }

  // a DND spell with an opposing save roll and subsequent damage
  protected static spellWithSave({
    dc,
    saveModifier = 0,
    damageDice,
    damageModifier = 0,
    options = {},
  }: SpellRoll["args"]) {
    return this.check({ difficulty: dc, modifier: saveModifier, options })
      .then(
        isFailure,
        this.damage({ dice: damageDice, modifier: damageModifier }),
        "setValue",
      )
      .then(
        isSuccess,
        options.saveTakesHalf
          ? this.damage({ dice: damageDice, modifier: damageModifier })
          : this.singleOutcome({ value: 0 }),
        "setHalf",
      )
      .condense();
  }

  // build a custom roll or sequence of rolls
  protected static custom({ initialRoll: roll, steps }: RollSequence) {
    let builder: DistributionBuilder;
    switch (roll.type) {
      case "basic":
        builder = roll.args.die
          ? this.rollDie(roll.args)
          : this.rollDice(roll.args);
        break;
      case "damage":
        builder = this.damage(roll.args);
        break;
      case "check":
        builder = this.check(roll.args);
        break;
      case "daggerheartCheck":
        builder = this.daggerheartCheck(roll.args);
        break;
      case "attack":
        builder = this.attack(roll.args);
        break;
      case "spellWithSave":
        builder = this.spellWithSave(roll.args);
        break;
      default:
        assertNever(roll);
        throw new Error("unexpected roll type");
    }

    return steps.reduce(
      (builder: DistributionBuilder, step: Step): DistributionBuilder => {
        switch (step.type) {
          case "and":
            return builder.and(
              DistributionBuilder.custom(step.roll),
              step.combine,
            );
          case "modify":
            return builder.modify(step.modifier);
          case "against":
            return builder.evaluate(step.difficulty);
          case "then": {
            const { success, failure, criticalSuccess, criticalFailure } =
              step.after;
            if (success)
              builder.then(
                (o) => o.success === true,
                DistributionBuilder.custom(success.roll),
                success.combine,
              );
            if (failure)
              builder.then(
                (o) => !o.success,
                DistributionBuilder.custom(failure.roll),
                failure.combine,
              );
            if (criticalSuccess)
              builder.then(
                (o) => o.success === true && o.crit === true,
                DistributionBuilder.custom(criticalSuccess.roll),
                criticalSuccess.combine,
              );
            if (criticalFailure)
              builder.then(
                (o) => !o.success && o.crit === true,
                DistributionBuilder.custom(criticalFailure.roll),
                criticalFailure.combine,
              );
            return builder;
          }
        }
      },
      builder,
    );
  }

  private and(
    other: DistributionBuilder | Array<DistributionBuilder>,
    combine: Combiner,
  ) {
    const others = other instanceof DistributionBuilder ? [other] : other;
    if (others.length < 1) return this;

    const combiner = getCombiner(combine);
    if (others.length > 1 && combiner.incremental === false) {
      return this._andAllTogether(others, combiner.fn);
    }

    return others.reduce(
      (a, v) => a._andIncremental(v, incrementalVersion(combiner)),
      this,
    );
  }

  // combine outcomes two at a time
  private _andIncremental(
    other: DistributionBuilder,
    combine: (a: Outcome, b: Outcome) => Outcome,
  ) {
    this.data = this.data
      .map((x) => other.data.map((y) => ({ ...combine(x, y), p: x.p * y.p })))
      .flat();

    return this.condense();
  }

  // combine outcomes that must be combined all at once, ie: dropping the lowest value or taking the average
  private _andAllTogether(
    others: Array<DistributionBuilder>,
    combine: (o: Array<Outcome>) => Outcome,
  ) {
    this.data = [this.data, ...others.map((s) => s.data)]
      // get the cartesian product of all outcomes
      .reduce((a, v) => v.map((o) => a.map((os) => [...os, o])).flat(), [
        [],
      ] as Array<Array<Outcome & { p: number }>>)
      // get the single resulting outcome in each case
      .map((os) => ({
        ...combine(os),
        p: os.reduce((a, b) => a * b.p, 1),
      }));

    return this.condense();
  }

  private then(
    check: boolean | ((o: Outcome) => boolean),
    next: DistributionBuilder,
    combine: Combiner,
  ) {
    if (check === false) return this;
    if (check === true) return this.and(next, combine);

    const combineFn = incrementalVersion(getCombiner(combine));
    this.data = this.data
      .map((x) =>
        check(x)
          ? next.data.map((y) => ({ ...combineFn(x, y), p: x.p * y.p }))
          : [x],
      )
      .flat();

    return this.condense();
  }

  private modify(modifier: number = 0) {
    this.data = this.data.map((o) => ({ ...o, value: o.value + modifier }));
    return this;
  }

  private evaluate(difficulty: number) {
    this.data = this.data.map((o) => ({
      ...o,
      success: o.success ?? o.value >= difficulty,
    }));
    return this.condense();
  }

  private condense(): DistributionBuilder {
    // this merges equivalent outcomes

    const compare = (a: Outcome, b: Outcome) =>
      a.value != b.value
        ? a.value - b.value
        : label(a) === label(b)
          ? 0
          : label(a) < label(b)
            ? -1
            : 1;

    this.data = this.data.sort(compare).reduce(
      (a, next) => {
        const last = a.pop();
        if (!last) return [next];
        if (compare(last, next) === 0) {
          a.push({ ...last, p: last.p + next.p });
        } else {
          a.push(last, next);
        }
        return a;
      },
      [] as OutcomeDistribution,
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

export function expectedValue(distribution: OutcomeDistribution): number {
  return distribution.reduce((sum, o) => sum + o.value * o.p, 0);
}

