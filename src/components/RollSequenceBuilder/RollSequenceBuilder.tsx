"use client";

import { Checkbox } from "react-aria-components";
import SelectField, {
  type SelectFieldOption,
} from "@/components/core/SelectField";
import {
  listCombiners,
  type CombineOutcomesStrategy,
} from "@/lib/combineOutcomesStrategy";
import {
  type Roll,
  type RollType,
  type RollOptions,
  type BasicRoll,
  type AttackRoll,
  type CheckRoll,
  type DaggerheartCheckRoll,
  type DamageRoll,
  type SpellRoll,
  initializeRoll,
} from "@/lib/roll";
import {
  type AndStep,
  type ModifyStep,
  type AgainstStep,
  type ThenStep,
  type Step,
  type RollSequence,
} from "@/lib/rollSequence";
import DiceField, { countsFromDice, getDice } from "@/components/DiceField";
import NumberField from "@/components/core/NumberField";
import RadioGroupField from "@/components/core/RadioGroupField";
import { AddStep } from "./AddStep";
import { Node } from "./Node";
import styles from "./RollSequenceBuilder.module.scss";

type CombineActionFieldProps = {
  value: CombineOutcomesStrategy;
  onChange: (action: CombineOutcomesStrategy) => void;
};

export const COMBINERS = listCombiners();

function CombineActionField({ value, onChange }: CombineActionFieldProps) {
  return (
    <SelectField
      label="Combine using"
      value={value}
      onChange={onChange}
      options={listCombiners()}
    />
  );
}

type AndStepProps = {
  step: AndStep;
  onChange: (step: AndStep) => void;
  onRemove?: () => void;
};

function AndStep({ step, onChange, onRemove }: AndStepProps) {
  return (
    <>
      <div className={styles.andBranch}>
        <Roll
          label="And roll..."
          rollSequence={step.roll}
          onChange={(block) => onChange({ ...step, ...block })}
          onRemove={onRemove}
        />
      </div>
      <div className={styles.andMerge}>
        <CombineActionField
          value={step.combine}
          onChange={(combine) => onChange({ ...step, combine })}
        />
      </div>
    </>
  );
}

type ThenStepProps = {
  step: ThenStep;
  onChange: (step: ThenStep) => void;
  onRemove?: () => void;
};

// const branches = [
// 'success', 'failure', 'criticalSuccess', 'criticalFailure'
// ];

function ThenStep({ step, onChange, onRemove }: ThenStepProps) {
  return (
    <>
      {Object.entries(step.after).map(([key, branch]) => (
        <div key={key} className={styles.thenBranch}>
          <Node label={`Then on ${key}...`} onRemove={onRemove}>
            <CombineActionField
              value={branch.combine}
              onChange={(_combine) => onChange(step)}
            />
          </Node>
          <Roll
            label="With roll..."
            rollSequence={branch.roll}
            onChange={(_block) => onChange(step)}
          />
        </div>
      ))}
    </>
  );
}

type ModifyStepProps = {
  step: ModifyStep;
  onChange: (step: ModifyStep) => void;
  onRemove?: () => void;
};

function ModifyStep({ step, onChange, onRemove }: ModifyStepProps) {
  return (
    <Node label="Modify" onRemove={onRemove}>
      <NumberField
        ariaLabel="Modifier"
        value={step.modifier}
        minValue={-20}
        maxValue={20}
        onChange={(modifier) => onChange({ ...step, modifier })}
      />
    </Node>
  );
}

type AgainstStepProps = {
  step: AgainstStep;
  onChange: (step: AgainstStep) => void;
  onRemove?: () => void;
};

function AgainstStep({ step, onChange, onRemove }: AgainstStepProps) {
  return (
    <Node label="Evaluate (DC)" onRemove={onRemove}>
      <NumberField
        ariaLabel="Difficulty (DC)"
        value={step.difficulty}
        minValue={0}
        maxValue={30}
        onChange={(difficulty) => onChange({ ...step, difficulty })}
      />
    </Node>
  );
}

const ROLL_KIND_OPTIONS: SelectFieldOption<Roll["type"]>[] = [
  { value: "basic", label: "Basic" },
  { value: "check", label: "Check" },
  { value: "daggerheartCheck", label: "Daggerheart-style check" },
  { value: "attack", label: "Attack with damage" },
  { value: "spellWithSave", label: "Spell cast with a save" },
  { value: "damage", label: "Damage roll" },
];

type RollOptionsFieldsProps<T extends RollOptions> = {
  value: T;
  onChange: (value: T) => void;
};

function RollOptionsFields<T extends RollOptions>({
  value,
  onChange,
}: RollOptionsFieldsProps<T>) {
  return (
    <>
      <RadioGroupField
        label="Tag as"
        value={value.with ?? "none"}
        options={[
          { value: "hope", label: "Hope" },
          { value: "fear", label: "Fear" },
          { value: "none", label: "None" },
        ]}
        onChange={(next) =>
          onChange({
            ...value,
            with: next === "hope" || next === "fear" ? next : undefined,
          })
        }
      />

      <div className={styles.critOptionsRow}>
        <Checkbox
          isSelected={value.criticalSuccess !== undefined}
          onChange={(isSelected) =>
            onChange({
              ...value,
              criticalSuccess: isSelected ? 20 : undefined,
            })
          }
          className={styles.checkbox}
        >
          <div className={styles.checkboxBox} aria-hidden="true" />
          Critical success on
        </Checkbox>
        <NumberField
          ariaLabel="Critical success value"
          value={value.criticalSuccess ?? 20}
          isDisabled={value.criticalSuccess === undefined}
          minValue={1}
          maxValue={100}
          onChange={(criticalSuccess) =>
            onChange({ ...value, criticalSuccess })
          }
        />
      </div>

      <div className={styles.critOptionsRow}>
        <Checkbox
          isSelected={value.criticalFailure !== undefined}
          onChange={(isSelected) =>
            onChange({
              ...value,
              criticalFailure: isSelected ? 1 : undefined,
            })
          }
          className={styles.checkbox}
        >
          <div className={styles.checkboxBox} aria-hidden="true" />
          Critical failure on
        </Checkbox>
        <NumberField
          ariaLabel="Critical failure value"
          value={value.criticalFailure ?? 1}
          isDisabled={value.criticalFailure === undefined}
          minValue={1}
          maxValue={100}
          onChange={(criticalFailure) =>
            onChange({ ...value, criticalFailure })
          }
        />
      </div>
    </>
  );
}

type StepListProps = {
  steps: Step[];
  onChange: (steps: Step[]) => void;
};

function StepList({ steps, onChange }: StepListProps) {
  function addStep(step: Step) {
    onChange([...steps, step]);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, updated: Step) {
    onChange(steps.map((step, i) => (i === index ? updated : step)));
  }

  return (
    <>
      {steps.map((step, index) => (
        <StepNode
          key={index}
          step={step}
          onChange={(updated) => updateStep(index, updated)}
          onRemove={() => removeStep(index)}
        />
      ))}

      <AddStep onSelect={addStep} />
    </>
  );
}

type StepNodeProps = {
  step: Step;
  onChange: (step: Step) => void;
  onRemove: () => void;
};

function StepNode({ step, ...rest }: StepNodeProps) {
  return step.type === "and" ? (
    <AndStep step={step} {...rest} />
  ) : step.type === "modify" ? (
    <ModifyStep step={step} {...rest} />
  ) : step.type === "against" ? (
    <AgainstStep step={step} {...rest} />
  ) : (
    <ThenStep step={step} {...rest} />
  );
}

type DifficultyFieldsProps = {
  label?: string;
  modifierLabel?: string;
  difficulty: number;
  modifier: number;
  has?: "advantage" | "disadvantage";
  onDifficultyChange: (difficulty: number) => void;
  onModifierChange: (modifier: number) => void;
  onHasChange: (has: "advantage" | "disadvantage" | undefined) => void;
};

function DifficultyFields({
  label = "Difficulty (DC)",
  modifierLabel = "Modifier",
  difficulty,
  modifier,
  has,
  onDifficultyChange,
  onModifierChange,
  onHasChange,
}: DifficultyFieldsProps) {
  return (
    <>
      <NumberField
        label={label}
        value={difficulty}
        minValue={0}
        maxValue={30}
        onChange={onDifficultyChange}
      />

      <NumberField
        label={modifierLabel}
        value={modifier}
        minValue={-20}
        maxValue={20}
        onChange={onModifierChange}
      />

      <RadioGroupField
        label="Has"
        value={has ?? "neither"}
        options={[
          { value: "advantage", label: "Advantage" },
          { value: "disadvantage", label: "Disadvantage" },
          { value: "neither", label: "Neither" },
        ]}
        onChange={(value) =>
          onHasChange(value === "neither" ? undefined : value)
        }
      />
    </>
  );
}

type BasicRollFieldsProps = {
  roll: BasicRoll;
  onChange: (roll: BasicRoll) => void;
};

function BasicRollFields({ roll, onChange }: BasicRollFieldsProps) {
  const dice = roll.args.dice ?? [roll.args.die];

  return (
    <>
      <DiceField
        label="Type a roll"
        counts={countsFromDice(dice)}
        allowModifier={false}
        onChange={(counts) => {
          const dice = getDice(counts);
          const args: BasicRoll["args"] =
            dice.length === 1
              ? { die: dice[0], options: roll.args.options }
              : {
                  dice,
                  options: roll.args.options,
                  combine: roll.args.combine ?? "sum",
                };
          onChange({ type: "basic", args });
        }}
      />

      {roll.args.dice && dice.length > 1 && (
        <CombineActionField
          value={roll.args.combine ?? "sum"}
          onChange={(combine) =>
            onChange({ ...roll, args: { ...roll.args, combine } } as BasicRoll)
          }
        />
      )}

      <RollOptionsFields
        value={roll.args.options ?? {}}
        onChange={(options) =>
          onChange({ ...roll, args: { ...roll.args, options } } as BasicRoll)
        }
      />
    </>
  );
}

type CheckRollFieldsProps = {
  roll: CheckRoll;
  onChange: (roll: CheckRoll) => void;
};

function CheckRollFields({ roll, onChange }: CheckRollFieldsProps) {
  const { difficulty, modifier, options = {} } = roll.args;

  function updateArgs(partial: Partial<CheckRoll["args"]>) {
    onChange({ ...roll, args: { ...roll.args, ...partial } });
  }

  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        difficulty={difficulty}
        modifier={modifier}
        has={options.has}
        onDifficultyChange={(difficulty) => updateArgs({ difficulty })}
        onModifierChange={(modifier) => updateArgs({ modifier })}
        onHasChange={(has) => updateArgs({ options: { ...options, has } })}
      />

      <Checkbox
        isSelected={options.nat1s ?? false}
        onChange={(nat1s) => updateArgs({ options: { ...options, nat1s } })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Natural 1 is a critical failure
      </Checkbox>
    </div>
  );
}

type DaggerheartCheckRollFieldsProps = {
  roll: DaggerheartCheckRoll;
  onChange: (roll: DaggerheartCheckRoll) => void;
};

function DaggerheartCheckRollFields({
  roll,
  onChange,
}: DaggerheartCheckRollFieldsProps) {
  const { difficulty, modifier = 0, options = {} } = roll.args;

  function updateArgs(partial: Partial<DaggerheartCheckRoll["args"]>) {
    onChange({ ...roll, args: { ...roll.args, ...partial } });
  }

  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        difficulty={difficulty}
        modifier={modifier}
        has={options.has}
        onDifficultyChange={(difficulty) => updateArgs({ difficulty })}
        onModifierChange={(modifier) => updateArgs({ modifier })}
        onHasChange={(has) => updateArgs({ options: { has } })}
      />
    </div>
  );
}

type AttackRollFieldsProps = {
  roll: AttackRoll;
  onChange: (roll: AttackRoll) => void;
};

function AttackRollFields({ roll, onChange }: AttackRollFieldsProps) {
  const {
    armor,
    modifier,
    damageDice,
    damageModifier = 0,
    options = {},
  } = roll.args;

  function updateArgs(partial: Partial<AttackRoll["args"]>) {
    onChange({ ...roll, args: { ...roll.args, ...partial } });
  }

  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        label="Armor Class (AC)"
        difficulty={armor}
        modifier={modifier}
        has={options.has}
        onDifficultyChange={(armor) => updateArgs({ armor })}
        onModifierChange={(modifier) => updateArgs({ modifier })}
        onHasChange={(has) => updateArgs({ options: { ...options, has } })}
      />

      <DiceField
        label="Damage"
        placeholder="e.g. 2d6 + 3"
        counts={countsFromDice(damageDice)}
        modifier={damageModifier}
        onChange={(damageCounts, damageModifier) =>
          updateArgs({ damageDice: getDice(damageCounts), damageModifier })
        }
      />

      <Checkbox
        isSelected={options.nat1s ?? false}
        onChange={(nat1s) => updateArgs({ options: { ...options, nat1s } })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Natural 1 is a critical failure
      </Checkbox>
    </div>
  );
}

type SpellRollFieldsProps = {
  roll: SpellRoll;
  onChange: (roll: SpellRoll) => void;
};

function SpellRollFields({ roll, onChange }: SpellRollFieldsProps) {
  const {
    dc,
    saveModifier = 0,
    damageDice,
    damageModifier = 0,
    options = {},
  } = roll.args;

  function updateArgs(partial: Partial<SpellRoll["args"]>) {
    onChange({ ...roll, args: { ...roll.args, ...partial } });
  }

  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        label="Spell DC"
        modifierLabel="Target's save modifier"
        difficulty={dc}
        modifier={saveModifier}
        has={options.has}
        onDifficultyChange={(dc) => updateArgs({ dc })}
        onModifierChange={(saveModifier) => updateArgs({ saveModifier })}
        onHasChange={(has) => updateArgs({ options: { ...options, has } })}
      />

      <DiceField
        label="Damage"
        placeholder="e.g. 8d6"
        counts={countsFromDice(damageDice)}
        modifier={damageModifier}
        onChange={(damageCounts, damageModifier) =>
          updateArgs({ damageDice: getDice(damageCounts), damageModifier })
        }
      />

      <Checkbox
        isSelected={options.saveTakesHalf ?? false}
        onChange={(saveTakesHalf) =>
          updateArgs({ options: { ...options, saveTakesHalf } })
        }
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Successful save takes half damage
      </Checkbox>

      <Checkbox
        isSelected={options.nat1s ?? false}
        onChange={(nat1s) => updateArgs({ options: { ...options, nat1s } })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Natural 1 is a critical failure
      </Checkbox>
    </div>
  );
}

type DamageRollFieldsProps = {
  roll: DamageRoll;
  onChange: (roll: DamageRoll) => void;
};

function DamageRollFields({ roll, onChange }: DamageRollFieldsProps) {
  return (
    <DiceField
      label="Damage"
      counts={countsFromDice(roll.args.dice)}
      modifier={roll.args.modifier ?? 0}
      onChange={(counts, modifier) =>
        onChange({ ...roll, args: { dice: getDice(counts), modifier } })
      }
    />
  );
}

type RollFieldsProps = {
  roll: Roll;
  onChange: (roll: Roll) => void;
};

function RollFields({ roll, onChange }: RollFieldsProps) {
  switch (roll.type) {
    case "basic":
      return <BasicRollFields roll={roll} onChange={onChange} />;
    case "check":
      return <CheckRollFields roll={roll} onChange={onChange} />;
    case "daggerheartCheck":
      return <DaggerheartCheckRollFields roll={roll} onChange={onChange} />;
    case "attack":
      return <AttackRollFields roll={roll} onChange={onChange} />;
    case "spellWithSave":
      return <SpellRollFields roll={roll} onChange={onChange} />;
    case "damage":
      return <DamageRollFields roll={roll} onChange={onChange} />;
  }
}

type RollProps = {
  rollSequence: RollSequence;
  label: string;
  onRemove?: () => void;
  onChange: (rollSequence: RollSequence) => void;
};

function Roll({ rollSequence, label = "Roll", onRemove, onChange }: RollProps) {
  return (
    <>
      <Node label={label} onRemove={onRemove}>
        <SelectField
          label="Roll type"
          value={rollSequence.initialRoll.type}
          onChange={(type) => onChange(withInitialRollKind(rollSequence, type))}
          options={ROLL_KIND_OPTIONS}
        />

        <RollFields
          roll={rollSequence.initialRoll}
          onChange={(initialRoll) => onChange({ ...rollSequence, initialRoll })}
        />
      </Node>

      <StepList
        steps={rollSequence.steps}
        onChange={(steps) => onChange({ ...rollSequence, steps })}
      />
    </>
  );
}

export type RollSequenceBuilderProps = {
  rollSequence: RollSequence;
  onChange: (roll: RollSequence) => void;
};

export function RollSequenceBuilder({
  rollSequence,
  onChange,
}: RollSequenceBuilderProps) {
  return (
    <div className={styles.stepFlow}>
      <Roll label="Roll" onChange={onChange} rollSequence={rollSequence} />
    </div>
  );
}

function withInitialRollKind(roll: RollSequence, type: RollType): RollSequence {
  if (roll.initialRoll.type === type) return roll;
  return { ...roll, initialRoll: initializeRoll(type) };
}
